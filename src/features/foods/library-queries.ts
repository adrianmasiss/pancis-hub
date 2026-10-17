import {
  getDietlyCatalogue,
  normalizeDietlyFood,
  dietlyImage,
  DIETLY_SOURCE_LABELS,
  dietlyFoodSchema,
} from "@/lib/food-providers/dietly";
import { inferFoodGroup } from "@/lib/food-providers/classify";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LibraryFood } from "./queries";
import { searchExternalFoods } from "./external-queries";
import type { SourceAgreement } from "@/features/foods/lib/source-agreement";
import type { LibraryCardFood } from "./library-types";
import type { ProviderSource } from "@/lib/food-providers/types";
import type { FoodGroup } from "./schemas";

export function localFoodCard(
  food: LibraryFood,
  agreement?: SourceAgreement,
): LibraryCardFood {
  return {
    key: food.id,
    foodId: food.id,
    provider: null,
    externalId: null,
    name: food.name,
    brand: food.brand,
    imageUrl: food.imageUrl,
    group: food.foodGroup,
    cookedState: food.cookedState,
    macros: {
      calories: food.calories,
      proteinG: food.proteinG,
      carbohydrateG: food.carbohydrateG,
      fatG: food.fatG,
      fiberG: food.fiberG,
    },
    source: food.isOwn ? "Tu alimento" : (food.source ?? "Biblioteca Pancis"),
    agreement: agreement ?? null,
    canUse: true,
    local: food,
    basis: food.nutritionBasis ?? "100g",
    density: food.densityGPerMl ?? null,
    portions: food.portions ?? [],
  };
}

export async function dietlyFoodCards(query?: string, group?: FoodGroup) {
  const admin = createAdminClient();
  const cacheKey = `catalogue:${query?.trim().toLowerCase() ?? "popular"}`;
  const { data: cached } = await admin
    .from("external_food_cache")
    .select("payload,fetched_at")
    .eq("source", "dietly")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  const freshCache =
    cached && Date.now() - Date.parse(cached.fetched_at) < 3600000;
  const rows = freshCache
    ? dietlyFoodSchema.array().safeParse(cached.payload)
    : null;
  const result = rows?.success
    ? { foods: rows.data, status: "ok" as const }
    : await getDietlyCatalogue(query);
  if (!rows?.success && result.status === "ok")
    await admin.from("external_food_cache").upsert(
      {
        source: "dietly",
        cache_key: cacheKey,
        payload: result.foods as unknown as never,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "source,cache_key" },
    );
  const foods: LibraryCardFood[] = result.foods.map((f) => {
    const normalized = normalizeDietlyFood(f);
    // Zeros here are used only for category inference, never nutrition display or storage.
    const inferred = inferFoodGroup(f.name, f.category, {
      calories: f.calories_kcal ?? 0,
      proteinG: f.protein_g ?? 0,
      carbohydrateG: f.carbs_g ?? 0,
      fatG: f.fat_g ?? 0,
      fiberG: f.fiber_g ?? 0,
    });
    return {
      key: `dietly:${f.id}`,
      foodId: null,
      provider: "dietly" as const,
      externalId: String(f.id),
      name: f.name,
      brand: f.brand,
      imageUrl: dietlyImage(f.image_url ?? f.image_thumb_url),
      group: normalized?.foodGroup ?? inferred,
      cookedState: normalized?.cookedState ?? null,
      macros: {
        calories: f.calories_kcal,
        proteinG: f.protein_g,
        carbohydrateG: f.carbs_g,
        fatG: f.fat_g,
        fiberG: f.fiber_g,
      },
      source: `Dietly · ${DIETLY_SOURCE_LABELS[f.source]}`,
      agreement: null,
      canUse: normalized !== null,
    };
  });
  return {
    foods: group ? foods.filter((f) => f.group === group) : foods,
    status: result.status,
  };
}

/** Rótulo de fuente que ve la persona. El nombre técnico no le sirve. */
const ROTULO_FUENTE: Record<ProviderSource, string> = {
  usda: "USDA",
  openfoodfacts: "Open Food Facts",
  dietly: "Dietly",
};

/**
 * Los resultados de USDA y Open Food Facts con la MISMA forma de tarjeta que
 * la biblioteca local y Dietly.
 *
 * Es lo que permite una sola lista. Antes estas dos fuentes vivían en un
 * bloque aparte al pie de la página, con otro diseño y un botón de importar:
 * para encontrarlas había que saber que existían.
 *
 * La fuente NO se borra al unificar. Un dato de USDA está medido en
 * laboratorio y uno de Open Food Facts lo subió alguien con el móvil; que
 * compartan tarjeta está bien, que no se distingan no — y el principio del
 * producto es que ningún número aparezca sin poder decir de dónde sale.
 */
export async function externalFoodCards(
  query: string,
): Promise<LibraryCardFood[]> {
  const resultados = await searchExternalFoods(query);
  return resultados.map((food) => ({
    key: `${food.source}:${food.externalId}`,
    // Si ya se importó alguna vez, la tarjeta apunta a la copia local y se
    // comporta como cualquier alimento propio.
    foodId: food.importedFoodId,
    provider: food.source,
    externalId: food.externalId,
    name: food.name,
    brand: food.brand,
    imageUrl: food.imageUrl,
    group: food.foodGroup,
    cookedState: food.cookedState,
    macros: {
      calories: food.per100g.calories,
      proteinG: food.per100g.proteinG,
      carbohydrateG: food.per100g.carbohydrateG,
      fatG: food.per100g.fatG,
      fiberG: food.per100g.fiberG,
    },
    source: food.provenance ?? ROTULO_FUENTE[food.source],
    // Un resultado recién llegado no tiene con qué contrastarse: el cotejo
    // existe para lo que ya está guardado, no para lo que acaba de aparecer.
    agreement: null,
    canUse: true,
    basis: food.nutritionBasis ?? "100g",
    density: null,
    portions: food.portions.map(({ label, grams }) => ({ label, grams })),
  }));
}

/**
 * Funde la biblioteca local con lo que devuelven los proveedores, en una
 * sola lista.
 *
 * Lo local va PRIMERO y gana siempre: trae favorito, correcciones del usuario
 * e ilustración, que el resultado externo no tiene. Un alimento ya importado
 * llega por los dos caminos —con el mismo `foodId`— y aparecería dos veces;
 * se queda la copia local.
 *
 * Lo externo no se reordena por fuente: el proveedor ya devolvió por
 * relevancia y anteponer USDA a Open Food Facts sería imponer un criterio de
 * calidad que la lista no puede justificar fila por fila.
 */
export function mergeLibraryCards(
  local: LibraryCardFood[],
  externas: LibraryCardFood[][],
): LibraryCardFood[] {
  const vistos = new Set<string>();
  for (const card of local) {
    vistos.add(card.key);
    if (card.foodId) vistos.add(`food:${card.foodId}`);
  }
  const resto: LibraryCardFood[] = [];
  for (const card of externas.flat()) {
    if (vistos.has(card.key)) continue;
    if (card.foodId && vistos.has(`food:${card.foodId}`)) continue;
    vistos.add(card.key);
    if (card.foodId) vistos.add(`food:${card.foodId}`);
    resto.push(card);
  }
  return [...local, ...resto];
}
