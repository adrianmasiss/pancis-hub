"use server";

import { revalidatePath } from "next/cache";
import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getGeminiSearchModel,
  hasGeminiApiKey,
  withGeminiFallback,
} from "@/lib/ai/google";
import { logMeal } from "@/features/nutrition/actions";
import { MEAL_TYPES } from "@/features/nutrition/schemas";
import { findRestaurantLogo } from "./lib/logo";
import { MENU_SECTIONS, RESTAURANT_CATEGORIES, dishMacros } from "./lib/menu";

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
  section: z.enum(MENU_SECTIONS).optional(),
});

/** Agrega un restaurante a la base compartida (o devuelve el que ya existe). */
export async function createRestaurant(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      category: z.enum(RESTAURANT_CATEGORIES).optional(),
    })
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
    .insert({
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: FALLO };
  // El logo real, si la cadena esta en Wikidata; sin el, quedan sus iniciales.
  const logo = await findRestaurantLogo(parsed.data.name);
  if (logo)
    await supabase
      .from("restaurants")
      .update({ logo_url: logo })
      .eq("id", data.id);
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
    section: d.section ?? "plato",
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
 * Registra un plato de restaurante en el dia: como extra, o en lugar de una
 * comida del plan (cuenta como esa comida hecha, igual que marcarla).
 *
 * `meal_items` necesita un alimento, asi que el plato se guarda una vez como
 * alimento propio del usuario (fuente `restaurante:<id>`, mas las opciones
 * elegidas) y se reutiliza. Si se conocen los gramos de la porcion, se guarda
 * por 100 g y se registran esos gramos; si no, la «porcion» vale 100 g y los
 * valores son por porcion.
 */
export async function logRestaurantItem(input: unknown): Promise<Result> {
  const parsed = z
    .object({
      itemId: z.uuid(),
      date: z.iso.date(),
      portions: z.number().min(0.25).max(5),
      optionIds: z.array(z.uuid()).max(10).default([]),
      insteadOfTemplateMealId: z.uuid().optional(),
    })
    .safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: FALLO };

  const { data: item } = await supabase
    .from("restaurant_items")
    .select(
      "id, name, serving_label, serving_g, calories, protein_g, carbohydrate_g, fat_g, fiber_g, restaurants(name), restaurant_item_options(id, label, calories_delta, protein_delta, carbohydrate_delta, fat_delta, fiber_delta)",
    )
    .eq("id", parsed.data.itemId)
    .single();
  if (!item || item.calories === null)
    return { error: "Este plato todavía no tiene sus valores." };

  const options = (item.restaurant_item_options ?? []).map((o) => ({
    id: o.id,
    label: o.label,
    calories: Number(o.calories_delta),
    proteinG: Number(o.protein_delta),
    carbohydrateG: Number(o.carbohydrate_delta),
    fatG: Number(o.fat_delta),
    fiberG: Number(o.fiber_delta),
  }));
  // Solo las opciones de ESTE plato; un id ajeno se ignora.
  const elegidas = options
    .filter((o) => parsed.data.optionIds.includes(o.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  const porcion = dishMacros(
    {
      calories: Number(item.calories),
      proteinG: Number(item.protein_g ?? 0),
      carbohydrateG: Number(item.carbohydrate_g ?? 0),
      fatG: Number(item.fat_g ?? 0),
      fiberG: Number(item.fiber_g ?? 0),
      options,
    },
    elegidas.map((o) => o.id),
  );
  if (!porcion) return { error: "Este plato todavía no tiene sus valores." };

  // La comida del plan que se reemplaza: la RLS solo deja ver las propias.
  let plan: { id: string; meal_type: string } | null = null;
  if (parsed.data.insteadOfTemplateMealId) {
    const { data } = await supabase
      .from("diet_template_meals")
      .select("id, meal_type")
      .eq("id", parsed.data.insteadOfTemplateMealId)
      .maybeSingle();
    if (!data) return { error: FALLO };
    plan = data;
  }

  const source = [`restaurante:${item.id}`, ...elegidas.map((o) => o.id)].join(
    ":",
  );
  const conOpciones = elegidas.length
    ? ` · ${elegidas.map((o) => o.label.toLowerCase()).join(", ")}`
    : "";
  const grams = item.serving_g ? Number(item.serving_g) : 100;
  const per100 = (v: number) => (v * 100) / grams;

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
        name: `${item.name}${conOpciones} (${item.restaurants?.name ?? "restaurante"})`,
        brand: item.restaurants?.name ?? null,
        food_group: "mixto",
        calories: per100(porcion.calories),
        protein_g: per100(porcion.proteinG),
        carbohydrate_g: per100(porcion.carbohydrateG),
        fat_g: per100(porcion.fatG),
        fiber_g: per100(porcion.fiberG),
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

  const mealType = (MEAL_TYPES as readonly string[]).includes(
    plan?.meal_type ?? "",
  )
    ? (plan!.meal_type as (typeof MEAL_TYPES)[number])
    : "otro";
  const result = await logMeal({
    date: parsed.data.date,
    mealType,
    name: `${item.name}${conOpciones} · ${item.restaurants?.name ?? "fuera"}`,
    sourceTemplateMealId: plan?.id,
    items: [{ foodId, quantityG: Math.round(grams * parsed.data.portions) }],
  });
  if ("error" in result)
    return plan
      ? { error: "Esa comida del plan ya está registrada hoy." }
      : result;
  if (plan) {
    // Como al cambiarla por receta: en «Hoy» la comida del plan dice
    // «Cambiada hoy» y muestra lo que se comio, no lo planeado.
    await supabase
      .from("meals")
      .update({ status: "completada_con_cambios" })
      .eq("user_id", user.id)
      .eq("date", parsed.data.date)
      .eq("source_template_meal_id", plan.id)
      .is("deleted_at", null);
  }
  return { success: true };
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
        satFatG: z.number().min(0).max(300).nullable(),
        sugarG: z.number().min(0).max(500).nullable(),
        sodiumMg: z.number().min(0).max(20000).nullable(),
        section: z.enum(MENU_SECTIONS),
        /** Variantes que la tabla publica con sus cifras (salsas, extras). */
        options: z
          .array(
            z.object({
              label: z.string().min(2).max(60),
              caloriesDelta: z.number().min(-2000).max(2000),
              proteinDelta: z.number().min(-200).max(200),
              carbohydrateDelta: z.number().min(-400).max(400),
              fatDelta: z.number().min(-200).max(200),
            }),
          )
          .max(6),
        sourceUrl: z.string().max(500).nullable(),
        /** Pais de la tabla de donde sale el dato, si no es el del restaurante. */
        country: z.string().max(40).nullable(),
      }),
    )
    .max(25),
  /** Tipo de comida del restaurante, si se deja ver. */
  category: z.enum(RESTAURANT_CATEGORIES).nullable(),
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
    .select("id, name, country, category, logo_url")
    .eq("id", parsed.data.restaurantId)
    .single();
  if (!restaurant) return { error: FALLO };

  try {
    /* La busqueda web solo funciona gratis con un modelo: ver getGeminiSearchModel. */
    const found = await generateText({
      model: getGeminiSearchModel(),
      tools: { google_search: google.tools.googleSearch({}) },
      prompt: `Busca la informacion nutricional oficial del menu de «${restaurant.name}» (pais: ${restaurant.country}). Prioriza la tabla nutricional publicada por el propio restaurante. Si no la publica para ese pais, usa la tabla oficial del mismo restaurante en otro pais (Estados Unidos, Mexico o España) y di de que pais es cada dato. Lista hasta 20 platos populares, cada uno con: nombre, porcion (descripcion y gramos si aparecen), calorias, proteina, carbohidratos, grasa, fibra, grasa saturada, azucar y sodio (mg) por porcion, la seccion del menu (plato, acompañamiento, bebida o postre) y la URL de donde sale el dato. Si la tabla publica variantes con sus propias cifras (sin salsa, salsas, extras, pan distinto), di cuanto cambia cada una. Di tambien que tipo de comida vende (hamburguesas, pollo, sandwiches, pizza, mexicana, asiatica, cafe, saludable u otro). Si no encuentras un valor, dilo; no lo inventes.`,
    });
    const urls = (found.sources ?? [])
      .map((s) => ("url" in s ? s.url : null))
      .filter((u): u is string => Boolean(u));

    /* Dar formato a un texto ya escrito: basta el rapido. */
    const { object } = await withGeminiFallback("rapido", (model) =>
      generateObject({
        model,
        schema: researchSchema,
        prompt: `Pasa este texto a la lista estructurada. Incluye SOLO los platos que traen calorias, proteina, carbohidratos y grasa. No inventes valores ni platos; si falta fibra, grasa saturada, azucar o sodio usa null. Si un plato no trae URL propia usa null. En country pon el pais de la tabla si se dice (o null). En section usa plato, acompanamiento, bebida o postre. En options pon solo variantes con cifras publicadas, como diferencia frente al plato base (negativa si quita); si no hay, lista vacia. En category el tipo de comida del restaurante (o null).\n\n${found.text}\n\nFuentes consultadas:\n${urls.join("\n")}`,
      }),
    );

    const logo = restaurant.logo_url
      ? null
      : await findRestaurantLogo(restaurant.name);
    if ((!restaurant.category && object.category) || logo) {
      await supabase
        .from("restaurants")
        .update({
          ...(!restaurant.category && object.category
            ? { category: object.category }
            : {}),
          ...(logo ? { logo_url: logo } : {}),
        })
        .eq("id", restaurant.id);
    }

    let added = 0;
    for (const item of object.items) {
      const { data: row, error } = await supabase
        .from("restaurant_items")
        .insert({
          restaurant_id: restaurant.id,
          name: item.name,
          serving_label: item.servingLabel,
          serving_g: item.servingG,
          calories: item.calories,
          protein_g: item.proteinG,
          carbohydrate_g: item.carbohydrateG,
          fat_g: item.fatG,
          fiber_g: item.fiberG ?? 0,
          sat_fat_g: item.satFatG,
          sugar_g: item.sugarG,
          sodium_mg: item.sodiumMg,
          section: item.section,
          status: "estimado",
          source_url: item.sourceUrl ?? urls[0] ?? null,
          source_note: item.country
            ? `Buscado en internet por la IA · tabla de ${item.country}`
            : "Buscado en internet por la IA",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error || !row) continue;
      added += 1;
      if (item.options.length > 0) {
        await supabase.from("restaurant_item_options").insert(
          item.options.map((o) => ({
            item_id: row.id,
            label: o.label,
            calories_delta: o.caloriesDelta,
            protein_delta: o.proteinDelta,
            carbohydrate_delta: o.carbohydrateDelta,
            fat_delta: o.fatDelta,
            created_by: user.id,
          })),
        );
      }
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
