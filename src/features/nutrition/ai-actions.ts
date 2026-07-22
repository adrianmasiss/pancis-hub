"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { getGeminiModel, hasGeminiApiKey } from "@/lib/ai/google";
import { createClient } from "@/lib/supabase/server";
import { fetchAndStoreFoodImage } from "@/lib/images/food-image";
import { messages } from "@/i18n/es-419";
import { pickBestMatch } from "@/features/nutrition/lib/food-matching";
import { FOOD_GROUPS } from "@/features/foods/schemas";

const t = messages.nutrition.aiDiet;

/**
 * La IA extrae texto + macros ESTIMADOS por item (para que cada fila tenga
 * numeros usables aunque no exista un alimento igual en el catalogo).
 * Nada de esto se guarda sin que el usuario lo revise y confirme
 * (docs/08_AI_ENGINE.md: nunca presentar estimaciones como certezas).
 */
const dietItemSchema = z.object({
  name: z.string().describe("Nombre del alimento tal como aparece en la dieta"),
  quantity_g: z.coerce
    .number()
    .positive()
    .describe("Cantidad estimada en gramos"),
  serving_equivalence: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Cantidad/unidad original si no venia en gramos, ej. '3 huevos'. null si ya venia en gramos.",
    ),
  food_group: z
    .enum(FOOD_GROUPS)
    .describe("Grupo alimentario mas cercano para este alimento"),
  calories: z.coerce
    .number()
    .nonnegative()
    .describe("Calorias estimadas para la cantidad indicada"),
  protein_g: z.coerce
    .number()
    .nonnegative()
    .describe("Proteina en gramos para la cantidad indicada"),
  carbohydrate_g: z.coerce
    .number()
    .nonnegative()
    .describe("Carbohidratos en gramos para la cantidad indicada"),
  fat_g: z.coerce
    .number()
    .nonnegative()
    .describe("Grasas en gramos para la cantidad indicada"),
  fiber_g: z.coerce
    .number()
    .nonnegative()
    .default(0)
    .describe("Fibra en gramos para la cantidad indicada"),
});

const dietPlanSchema = z.object({
  name: z.string().describe("Nombre del plan o dieta (ej. 'Dieta Definicion')"),
  target_calories: z.coerce.number().nonnegative(),
  target_protein: z.coerce.number().nonnegative(),
  target_carbs: z.coerce.number().nonnegative(),
  target_fat: z.coerce.number().nonnegative(),
  meals: z.array(
    z.object({
      meal_type: z.enum(["desayuno", "almuerzo", "cena", "snack", "otro"]),
      name: z.string(),
      items: z.array(dietItemSchema),
    }),
  ),
});

export type DietPlanResponse = z.infer<typeof dietPlanSchema>;
export type DietItemResponse = z.infer<typeof dietItemSchema>;

const SYSTEM_PROMPT = `Eres un experto nutricionista. Extrae la informacion de un plan de dieta o menu a partir de un texto, imagen o PDF.

Para CADA alimento debes estimar: gramos, grupo alimentario y sus macronutrientes (calorias, proteina, carbohidratos, grasas, fibra) PARA LA CANTIDAD INDICADA (no por 100 g). Estas cifras son solo un punto de partida: el usuario las revisara y corregira antes de guardar, asi que estima de forma razonable y conservadora aunque no seas exacto.

Si el texto expresa el alimento en porciones o unidades domesticas (ej. "3 huevos", "2 rebanadas de pan", "1 taza de arroz"), guarda esa expresion exacta en 'serving_equivalence' y estima su peso en gramos. Si ya viene en gramos, deja 'serving_equivalence' en null.

Si la dieta no da calorias/macros totales del dia, calculalos sumando los alimentos.

meal_type debe ser uno de: "desayuno", "almuerzo", "cena", "snack", "otro".
food_group debe ser uno de: ${FOOD_GROUPS.join(", ")}.`;

const SUPPORTED_DIET_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_DIET_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function parseDietPlanImage(
  base64Data: string,
  mimeType: string = "image/jpeg",
): Promise<{ data?: DietPlanResponse; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errors.notAuthenticated };

  if (!hasGeminiApiKey()) {
    return { error: t.errors.aiUnavailable };
  }

  if (!SUPPORTED_DIET_FILE_TYPES.has(mimeType)) {
    return { error: t.errors.unsupportedFormat };
  }

  const estimatedFileSizeBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedFileSizeBytes > MAX_DIET_FILE_SIZE_BYTES) {
    return { error: t.errors.fileTooLarge };
  }

  try {
    const { object } = await generateObject({
      model: getGeminiModel(),
      schema: dietPlanSchema,
      schemaName: "diet_plan",
      schemaDescription:
        "Plan nutricional extraido desde una imagen o PDF de dieta.",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrae el plan de alimentacion de este archivo, con macros estimados por alimento.",
            },
            { type: "file", data: base64Data, mediaType: mimeType },
          ],
        },
      ],
    });

    return { data: object };
  } catch (error) {
    console.error("AI Parse Error:", error);
    return { error: t.errors.parseFailed };
  }
}

export type CatalogFoodMatch = {
  id: string;
  name: string;
  brand: string | null;
  cookedState: string | null;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

/** Busqueda de catalogo con macros completos, para el editor de revision. */
export async function searchCatalogFoodsFull(
  term: string,
): Promise<{ error: string } | { results: CatalogFoodMatch[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || term.trim().length < 2) return { results: [] };

  const { data, error } = await supabase
    .from("foods")
    .select(
      "id, name, brand, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
    )
    .ilike("name", `%${term.trim()}%`)
    .is("deleted_at", null)
    .order("name")
    .limit(15);
  if (error) return { error: t.errors.searchFailed };

  return {
    results: (data ?? []).map((food) => ({
      id: food.id,
      name: food.name,
      brand: food.brand,
      cookedState: food.cooked_state,
      calories: Number(food.calories),
      proteinG: Number(food.protein_g),
      carbohydrateG: Number(food.carbohydrate_g),
      fatG: Number(food.fat_g),
      fiberG: Number(food.fiber_g),
    })),
  };
}

/**
 * Sugerencia automatica (una por item) para prellenar el editor.
 *
 * Se traen los candidatos UNA vez y se puntuan en memoria con
 * pickBestMatch, que normaliza acentos y plurales. Antes se hacia una
 * consulta ilike por item usando solo la primera palabra, y cada fallo
 * ("Claras" no encontraba "Clara de huevo") terminaba creando un alimento
 * personalizado duplicado en la biblioteca del usuario.
 *
 * Si nada supera el umbral se devuelve null: es preferible que el usuario
 * elija a sugerirle el alimento equivocado, que se registraria sin que lo
 * note.
 */
export async function suggestCatalogMatches(
  itemNames: string[],
): Promise<Record<string, CatalogFoodMatch | null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: candidates } = await supabase
    .from("foods")
    .select(
      "id, name, brand, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
    )
    .is("deleted_at", null)
    .limit(500);

  const catalog: CatalogFoodMatch[] = (candidates ?? []).map((food) => ({
    id: food.id,
    name: food.name,
    brand: food.brand,
    cookedState: food.cooked_state,
    calories: Number(food.calories),
    proteinG: Number(food.protein_g),
    carbohydrateG: Number(food.carbohydrate_g),
    fatG: Number(food.fat_g),
    fiberG: Number(food.fiber_g),
  }));

  const results: Record<string, CatalogFoodMatch | null> = {};
  for (const name of itemNames) {
    results[name] = pickBestMatch(name, catalog)?.candidate ?? null;
  }
  return results;
}

// ------------------------------------------------------ guardado editado

const reviewedItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantityG: z.number().positive().max(5000),
  servingEquivalence: z.string().trim().max(80).optional(),
  /** Si existe, se vincula al alimento del catalogo (macros reales). */
  foodId: z.uuid().optional(),
  /** Si no hay foodId, estos macros (editados por el usuario) crean un alimento personal. */
  foodGroup: z.enum(FOOD_GROUPS).optional(),
  calories: z.number().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  carbohydrateG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  fiberG: z.number().nonnegative().optional(),
});

const reviewedMealSchema = z.object({
  mealType: z.enum(["desayuno", "almuerzo", "cena", "snack", "otro"]),
  name: z.string().trim().max(80).optional(),
  items: z.array(reviewedItemSchema).min(1),
});

const saveDietSchema = z.object({
  name: z.string().trim().min(1).max(100),
  targetCalories: z.number().nonnegative(),
  targetProtein: z.number().nonnegative(),
  targetCarbs: z.number().nonnegative(),
  targetFat: z.number().nonnegative(),
  meals: z.array(reviewedMealSchema).min(1),
});

export type SaveDietInput = z.infer<typeof saveDietSchema>;

export async function saveReviewedDiet(
  input: unknown,
): Promise<{ error: string } | { success: true }> {
  const parsed = saveDietSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.errors.saveFailed };
  const data = parsed.data;

  // Solo una dieta activa a la vez: desactiva cualquier plantilla previa
  // antes de insertar la nueva (si no, Inicio/comparador quedan con dos
  // filas is_active=true y las consultas .maybeSingle() fallan).
  await supabase
    .from("diet_templates")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { data: template, error: templateError } = await supabase
    .from("diet_templates")
    .insert({
      user_id: user.id,
      name: data.name,
      is_active: true,
      target_calories: data.targetCalories,
      target_protein: data.targetProtein,
      target_carbs: data.targetCarbs,
      target_fat: data.targetFat,
    })
    .select("id")
    .single();
  if (templateError || !template) return { error: t.errors.saveFailed };

  for (const [index, meal] of data.meals.entries()) {
    const { data: mealRecord, error: mealError } = await supabase
      .from("diet_template_meals")
      .insert({
        template_id: template.id,
        meal_type: meal.mealType,
        name: meal.name || null,
        order_index: index,
      })
      .select("id")
      .single();
    if (mealError || !mealRecord) return { error: t.errors.saveFailed };

    for (const item of meal.items) {
      let foodId = item.foodId;

      // Sin alimento del catalogo: crear un alimento personal con los
      // macros que el usuario reviso/edito (nunca se guarda sin macros).
      // El catalogo guarda valores por 100 g (docs/DATABASE.md); los macros
      // revisados en pantalla son para la cantidad servida, hay que
      // normalizarlos antes de insertar.
      if (!foodId) {
        if (
          item.calories === undefined ||
          item.proteinG === undefined ||
          item.carbohydrateG === undefined ||
          item.fatG === undefined
        ) {
          return { error: `${t.errors.missingMacros} (${item.name})` };
        }
        const factor = 100 / item.quantityG;
        const { data: customFood, error: foodError } = await supabase
          .from("foods")
          .insert({
            owner_user_id: user.id,
            name: item.name,
            food_group: item.foodGroup ?? "otro",
            calories: Math.round(item.calories * factor * 10) / 10,
            protein_g: Math.round(item.proteinG * factor * 10) / 10,
            carbohydrate_g: Math.round(item.carbohydrateG * factor * 10) / 10,
            fat_g: Math.round(item.fatG * factor * 10) / 10,
            fiber_g: Math.round((item.fiberG ?? 0) * factor * 10) / 10,
            source: "estimacion_ia",
            verified: false,
          })
          .select("id")
          .single();
        if (foodError || !customFood) return { error: t.errors.saveFailed };
        foodId = customFood.id;

        const imageUrl = await fetchAndStoreFoodImage({
          query: `${item.name} comida`,
          pathPrefix: "foods",
          id: customFood.id,
        });
        if (imageUrl) {
          await supabase
            .from("foods")
            .update({ image_url: imageUrl })
            .eq("id", customFood.id);
        }
      }

      const { error: itemError } = await supabase
        .from("diet_template_items")
        .insert({
          template_meal_id: mealRecord.id,
          food_id: foodId,
          quantity_g: item.quantityG,
          serving_equivalence: item.servingEquivalence || null,
        });
      if (itemError) return { error: t.errors.saveFailed };
    }
  }

  return { success: true };
}
