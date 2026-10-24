"use server";

import { revalidatePath } from "next/cache";
import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGeminiModel, hasGeminiApiKey } from "@/lib/ai/google";
import { logMeal } from "@/features/nutrition/actions";

type Result<T = object> = ({ success: true } & T) | { error: string };

const FALLO = "No se pudo guardar. Intenta de nuevo.";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const macro = z.number().min(0).max(5000);

const itemSchema = z.object({
  restaurantId: z.uuid(),
  name: z.string().trim().min(2).max(120),
  servingLabel: z.string().trim().max(80).optional(),
  servingG: z.number().positive().max(5000).optional(),
  calories: macro,
  proteinG: macro,
  carbohydrateG: macro,
  fatG: macro,
  fiberG: macro.optional(),
});

/** Agrega un restaurante a la base compartida (o devuelve el que ya existe). */
export async function createRestaurant(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80) })
    .safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: FALLO };

  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .ilike("name", parsed.data.name)
    .maybeSingle();
  if (existing) return { success: true, id: existing.id };

  const { data, error } = await supabase
    .from("restaurants")
    .insert({ name: parsed.data.name, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { error: FALLO };
  revalidatePath("/nutricion");
  return { success: true, id: data.id };
}

/**
 * Agrega un plato escrito por el usuario. Queda «estimado»: solo un admin lo
 * marca como verificado contra la tabla oficial del restaurante.
 */
export async function addRestaurantItem(input: unknown): Promise<Result> {
  const parsed = itemSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: FALLO };
  const d = parsed.data;
  const { error } = await supabase.from("restaurant_items").insert({
    restaurant_id: d.restaurantId,
    name: d.name,
    serving_label: d.servingLabel || null,
    serving_g: d.servingG ?? null,
    calories: d.calories,
    protein_g: d.proteinG,
    carbohydrate_g: d.carbohydrateG,
    fat_g: d.fatG,
    fiber_g: d.fiberG ?? 0,
    status: "estimado",
    source_note: "Agregado por un usuario",
    created_by: user.id,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Ese plato ya está en el menú." : FALLO,
    };
  }
  revalidatePath("/nutricion");
  return { success: true };
}

/**
 * Registra un plato de restaurante en el dia, como comida fuera del plan.
 *
 * `meal_items` necesita un alimento, asi que el plato se guarda una vez como
 * alimento propio del usuario (fuente `restaurante:<id>`) y se reutiliza. Si
 * se conocen los gramos de la porcion, se guarda por 100 g y se registran
 * esos gramos; si no, la «porcion» vale 100 g y los valores son por porcion.
 */
export async function logRestaurantItem(input: unknown): Promise<Result> {
  const parsed = z
    .object({
      itemId: z.uuid(),
      date: z.iso.date(),
      portions: z.number().min(0.25).max(5),
    })
    .safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: FALLO };

  const { data: item } = await supabase
    .from("restaurant_items")
    .select(
      "id, name, serving_label, serving_g, calories, protein_g, carbohydrate_g, fat_g, fiber_g, restaurants(name)",
    )
    .eq("id", parsed.data.itemId)
    .single();
  if (!item || item.calories === null)
    return { error: "Este plato todavía no tiene sus valores." };

  const source = `restaurante:${item.id}`;
  const grams = item.serving_g ? Number(item.serving_g) : 100;
  const per100 = (v: unknown) => (Number(v ?? 0) * 100) / grams;

  let foodId: string | null = null;
  const { data: existing } = await supabase
    .from("foods")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("source", source)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) {
    foodId = existing.id;
  } else {
    const { data: food, error } = await supabase
      .from("foods")
      .insert({
        owner_user_id: user.id,
        name: `${item.name} (${item.restaurants?.name ?? "restaurante"})`,
        brand: item.restaurants?.name ?? null,
        food_group: "mixto",
        calories: per100(item.calories),
        protein_g: per100(item.protein_g),
        carbohydrate_g: per100(item.carbohydrate_g),
        fat_g: per100(item.fat_g),
        fiber_g: per100(item.fiber_g),
        serving_amount: item.serving_g ? grams : 1,
        serving_unit: item.serving_g ? "g" : "porción",
        grams_per_serving: grams,
        source,
        verified: false,
      })
      .select("id")
      .single();
    if (error || !food) return { error: FALLO };
    foodId = food.id;
  }

  const result = await logMeal({
    date: parsed.data.date,
    mealType: "otro",
    name: `${item.name} · ${item.restaurants?.name ?? "fuera"}`,
    items: [{ foodId, quantityG: Math.round(grams * parsed.data.portions) }],
  });
  return "error" in result ? result : { success: true };
}

const researchSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(2).max(120),
        servingLabel: z.string().max(80).nullable(),
        servingG: z.number().positive().max(5000).nullable(),
        calories: z.number().min(0).max(5000),
        proteinG: z.number().min(0).max(500),
        carbohydrateG: z.number().min(0).max(800),
        fatG: z.number().min(0).max(500),
        fiberG: z.number().min(0).max(200).nullable(),
        sourceUrl: z.string().max(500).nullable(),
        /** Pais de la tabla de donde sale el dato, si no es el del restaurante. */
        country: z.string().max(40).nullable(),
      }),
    )
    .max(25),
});

/**
 * La IA busca en internet el menu del restaurante con sus valores y lo suma
 * a la base compartida como «estimado», con la fuente de cada plato. No pisa
 * los platos que ya existen.
 *
 * Dos llamadas: Gemini no combina la busqueda web con salida estructurada,
 * asi que la primera busca y redacta, y la segunda solo da formato.
 */
export async function researchRestaurant(
  input: unknown,
): Promise<Result<{ added: number }>> {
  const parsed = z.object({ restaurantId: z.uuid() }).safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: FALLO };
  if (!hasGeminiApiKey())
    return { error: "La búsqueda con IA no está disponible ahora." };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, country")
    .eq("id", parsed.data.restaurantId)
    .single();
  if (!restaurant) return { error: FALLO };

  try {
    /* Si el modelo principal esta saturado (503) o sin cuota, el lite. */
    const buscar = (modelId?: string) =>
      generateText({
        model: getGeminiModel(modelId),
        tools: { google_search: google.tools.googleSearch({}) },
        prompt: `Busca la informacion nutricional oficial del menu de «${restaurant.name}» (pais: ${restaurant.country}). Prioriza la tabla nutricional publicada por el propio restaurante. Si no la publica para ese pais, usa la tabla oficial del mismo restaurante en otro pais (Estados Unidos, Mexico o España) y di de que pais es cada dato. Lista hasta 20 platos populares, cada uno con: nombre, porcion (descripcion y gramos si aparecen), calorias, proteina, carbohidratos, grasa y fibra por porcion, y la URL de donde sale el dato. Si no encuentras un valor, dilo; no lo inventes.`,
      });
    const found = await buscar().catch(() => buscar("gemini-3.1-flash-lite"));
    const urls = (found.sources ?? [])
      .map((s) => ("url" in s ? s.url : null))
      .filter((u): u is string => Boolean(u));

    const formatear = (modelId?: string) =>
      generateObject({
        model: getGeminiModel(modelId),
        schema: researchSchema,
        prompt: `Pasa este texto a la lista estructurada. Incluye SOLO los platos que traen calorias, proteina, carbohidratos y grasa. No inventes valores ni platos. Si un plato no trae URL propia usa null. En country pon el pais de la tabla si se dice (o null).\n\n${found.text}\n\nFuentes consultadas:\n${urls.join("\n")}`,
      });
    const { object } = await formatear().catch(() =>
      formatear("gemini-3.1-flash-lite"),
    );

    let added = 0;
    for (const item of object.items) {
      const { error } = await supabase.from("restaurant_items").insert({
        restaurant_id: restaurant.id,
        name: item.name,
        serving_label: item.servingLabel,
        serving_g: item.servingG,
        calories: item.calories,
        protein_g: item.proteinG,
        carbohydrate_g: item.carbohydrateG,
        fat_g: item.fatG,
        fiber_g: item.fiberG ?? 0,
        status: "estimado",
        source_url: item.sourceUrl ?? urls[0] ?? null,
        source_note: item.country
          ? `Buscado en internet por la IA · tabla de ${item.country}`
          : "Buscado en internet por la IA",
        created_by: user.id,
      });
      if (!error) added += 1;
    }
    revalidatePath("/nutricion");
    return { success: true, added };
  } catch (error) {
    console.error("Busqueda de restaurante:", error);
    return {
      error:
        "La IA no pudo buscar ahora (puede ser la cuota del día). Intenta más tarde o agrega el plato a mano.",
    };
  }
}
