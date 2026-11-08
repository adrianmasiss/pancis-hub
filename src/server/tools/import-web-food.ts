import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasGeminiApiKey } from "@/lib/ai/google";
import {
  normalizeFoodName,
  prepareWebFood,
  webSourceSchema,
  type WebFoodResult,
} from "@/features/foods/lib/web-food";
import { importExternalFood } from "@/features/foods/external-actions";
import { openFoodFactsProvider } from "@/lib/food-providers";
import type { NormalizedFood } from "@/lib/food-providers/types";
import { researchFoodOnWeb } from "./web-food-research";
import {
  findOnOpenFoodFacts,
  isCompleteOffFood,
  offProductUrl,
} from "./off-lookup";

/** UUID determinista: los reintentos compiten por la misma PK, nunca sobrescriben. */
export function webFoodId(userId: string, name: string, brand: string | null) {
  const hash = createHash("sha1")
    .update(
      `pancis:web-food:v1:${userId}:${normalizeFoodName(name)}:${normalizeFoodName(brand ?? "")}:CR`,
    )
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

/** Una ficha de Open Food Facts al catálogo, por su código: el servidor vuelve a pedirla. */
async function saveFromOpenFoodFacts(
  query: string,
  food: NormalizedFood,
): Promise<WebFoodResult> {
  const sources = [
    {
      title: "Open Food Facts",
      url: offProductUrl(food.barcode ?? food.externalId),
    },
  ];
  const result = await importExternalFood({
    source: "openfoodfacts",
    externalId: food.externalId,
  });
  if ("error" in result)
    return {
      query,
      sources,
      status: "unavailable",
      message:
        "Encontré el producto en Open Food Facts, pero no pude guardarlo. No se registró como comida.",
    };
  revalidatePath("/nutricion", "layout");
  const unit = food.nutritionBasis === "100ml" ? "100 ml" : "100 g";
  return {
    query,
    sources,
    foodId: result.foodId,
    name: food.name,
    status: result.alreadyExisted ? "existing" : "saved",
    message: `${result.alreadyExisted ? "Ya estaba" : "Agregado"} en la biblioteca desde Open Food Facts, con la etiqueta por ${unit}. Es una base comunitaria: no está verificado, revisalo contra tu empaque.`,
  };
}

function describeChoices(foods: NormalizedFood[]) {
  return foods
    .map((food, i) => {
      const unit = food.nutritionBasis === "100ml" ? "100 ml" : "100 g";
      const { calories, proteinG, carbohydrateG, fatG } = food.per100g;
      return `${i + 1}) ${food.name}${food.brand ? ` (${food.brand})` : ""}: ${calories} kcal, ${proteinG} g proteína, ${carbohydrateG} g carbohidratos, ${fatG} g grasa por ${unit}; código ${food.barcode ?? food.externalId}`;
    })
    .join(". ");
}

/** Solo lo llama el servidor del copiloto; la sesión determina el dueño. */
export async function importWebFood(
  input: unknown,
  options: { barcode?: string } = {},
): Promise<WebFoodResult> {
  const parsed = z.string().trim().min(2).max(120).safeParse(input);
  const query = parsed.success ? parsed.data : "";
  const base = { query, sources: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !parsed.success)
    return {
      ...base,
      status: "unavailable",
      message: "Necesitás iniciar sesión y escribir el nombre del producto.",
    };
  const term = query.replace(/[%_\\]/g, (c) => `\\${c}`);
  const [named, aliased] = await Promise.all([
    supabase
      .from("foods")
      .select("id, name, brand")
      .ilike("name", term)
      .is("deleted_at", null)
      .is("data_issue", null)
      .limit(3),
    supabase
      .from("food_aliases")
      .select("food_id")
      .ilike("alias", term)
      .limit(3),
  ]);
  const ids = [
    ...new Set([
      ...(named.data ?? []).map((f) => f.id),
      ...(aliased.data ?? []).map((f) => f.food_id),
    ]),
  ];
  if (ids.length === 1) {
    const { data: existing } = await supabase
      .from("foods")
      .select("id, name")
      .eq("id", ids[0]!)
      .is("deleted_at", null)
      .is("data_issue", null)
      .maybeSingle();
    if (existing)
      return {
        ...base,
        status: "existing",
        foodId: existing.id,
        name: existing.name,
        message: "Ya está en tu biblioteca. No creé un duplicado.",
      };
  }
  /*
   * Orden: catálogo (arriba), Open Food Facts, la web. OFF es gratis, no gasta
   * cuota de IA y trae la etiqueta completa; la web queda para lo que OFF no
   * tiene. Ver off-lookup.ts.
   */
  const barcode = options.barcode?.trim();
  if (barcode) {
    const food = /^\d{6,14}$/.test(barcode)
      ? await openFoodFactsProvider
          .getFoodByBarcode?.(barcode, AbortSignal.timeout(8_000))
          .catch(() => null)
      : null;
    if (!food)
      return {
        ...base,
        status: "incomplete",
        message: `No encontré el código ${barcode} en Open Food Facts. Una foto de la etiqueta sirve para crear la ficha.`,
      };
    if (!isCompleteOffFood(food))
      return {
        ...base,
        status: "incomplete",
        name: food.name,
        sources: [{ title: "Open Food Facts", url: offProductUrl(barcode) }],
        message:
          "La ficha de Open Food Facts de ese código está incompleta. Una foto de la etiqueta sirve para completarla.",
      };
    return saveFromOpenFoodFacts(query, food);
  }
  const off = await findOnOpenFoodFacts(query);
  if (off.kind === "one") return saveFromOpenFoodFacts(query, off.food);
  if (off.kind === "choices")
    return {
      ...base,
      status: "incomplete",
      name: off.foods[0]!.name,
      sources: off.foods.map((food) => ({
        title: `Open Food Facts · ${food.name}`,
        url: offProductUrl(food.barcode ?? food.externalId),
      })),
      message: `Open Food Facts tiene ${off.foods.length} fichas de este producto que no coinciden, así que no elegí por vos. ${describeChoices(off.foods)}. Decime cuál coincide con tu empaque (el código está debajo de las barras) o escaneá el código.`,
    };

  if (!hasGeminiApiKey())
    return {
      ...base,
      status: "unavailable",
      message: "La búsqueda web necesita que Gemini esté configurado.",
    };
  let research;
  try {
    research = await researchFoodOnWeb(query);
  } catch {
    return {
      ...base,
      status: "unavailable",
      message:
        "La búsqueda web no respondió o agotó su cuota. No agregué ningún producto; podés reintentar.",
    };
  }
  const found = {
    ...base,
    sources: research.sources.filter(
      (s) => webSourceSchema.safeParse(s).success,
    ),
    searchSuggestions: research.searchSuggestions,
  };
  if (!research.reading)
    return {
      ...found,
      status: "incomplete",
      message:
        "No encontré una ficha nutricional completa respaldada por las páginas consultadas. Probá con la marca y presentación o una foto de la etiqueta.",
    };
  const reading = research.reading;
  const prepared = prepareWebFood(reading, research.report, research.sources);
  if (prepared.status !== "ready")
    return { ...found, name: reading.name, ...prepared };
  const id = webFoodId(user.id, reading.name, reading.brand);
  const { values } = prepared;
  const { error } = await supabase.from("foods").insert({
    id,
    owner_user_id: user.id,
    name: reading.name,
    brand: reading.brand,
    food_group: reading.foodGroup,
    nutrition_basis: prepared.nutritionBasis,
    calories: values.calories,
    protein_g: values.proteinG,
    carbohydrate_g: values.carbohydrateG,
    fat_g: values.fatG,
    fiber_g: values.fiberG,
    sugar_g: values.sugarG,
    sodium_mg: values.sodiumMg,
    source: "Web · importado por IA, sin revisión de etiqueta",
    verified: false,
    web_provenance: {
      query,
      queriedAt: new Date().toISOString(),
      reading,
      sources: prepared.sources,
    },
  });
  if (error) {
    const { data: raced } = await supabase
      .from("foods")
      .select("id, name")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .is("deleted_at", null)
      .is("data_issue", null)
      .maybeSingle();
    if (!raced)
      return {
        ...found,
        status: "unavailable",
        message:
          "Encontré la información, pero no pude guardarla en tu biblioteca. No se registró como comida.",
      };
  }
  // Accesorios reparables en reintentos. Su fallo nunca oculta que la ficha sí se guardó.
  const aliases = [
    ...new Set([
      query,
      reading.name,
      normalizeFoodName(query),
      normalizeFoodName(reading.name),
    ]),
  ].filter((s) => s.length <= 60);
  const aliasResults = await Promise.all(
    aliases.map((alias) =>
      supabase
        .from("food_aliases")
        .insert({ food_id: id, alias, locale: "es" }),
    ),
  );
  const aliasFailed = aliasResults.some(
    (r) => r.error && r.error.code !== "23505",
  );
  let portionFailed = false;
  if (prepared.portion) {
    const { error: portionError } = await supabase
      .from("food_portions")
      .insert({
        food_id: id,
        label: prepared.portion.label,
        grams: prepared.portion.grams,
        source: "usuario",
        owner_user_id: user.id,
      });
    portionFailed = Boolean(portionError && portionError.code !== "23505");
  }
  revalidatePath("/nutricion", "layout");
  return {
    ...found,
    sources: prepared.sources,
    foodId: id,
    name: reading.name,
    status: error ? "existing" : "saved",
    message: `${error ? "Ya estaba" : "Agregado"} en tu biblioteca personal con sus fuentes. Importado de la web; pendiente de revisar contra la etiqueta.${aliasFailed ? " Buscalo por su nombre oficial." : ""}${portionFailed ? " La porción no se pudo guardar; usá gramos." : ""}`,
  };
}
