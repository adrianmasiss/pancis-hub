"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { getGeminiModel } from "@/lib/ai/google";
import { createClient } from "@/lib/supabase/server";

const dietPlanSchema = z.object({
  name: z
    .string()
    .describe("El nombre del plan o dieta (ej. 'Dieta Definición')"),
  target_calories: z.coerce
    .number()
    .nonnegative()
    .describe("Calorías objetivo totales"),
  target_protein: z.coerce
    .number()
    .nonnegative()
    .describe("Proteína objetivo total en gramos"),
  target_carbs: z.coerce
    .number()
    .nonnegative()
    .describe("Carbohidratos objetivo totales en gramos"),
  target_fat: z.coerce
    .number()
    .nonnegative()
    .describe("Grasa objetivo total en gramos"),
  meals: z.array(
    z.object({
      meal_type: z
        .enum(["desayuno", "almuerzo", "cena", "snack", "otro"])
        .describe("Tipo de comida"),
      name: z
        .string()
        .describe("Nombre de la comida (ej. 'Desayuno pre-entreno')"),
      items: z.array(
        z.object({
          name: z.string().describe("Nombre del alimento en la dieta"),
          quantity_g: z.coerce
            .number()
            .positive()
            .describe("Cantidad en gramos sugerida"),
          serving_equivalence: z
            .string()
            .nullable()
            .optional()
            .describe("Cantidad y unidad original si no estaba originalmente expresada en gramos, ej. '3 huevos', '2 rebanadas', '1 taza'. Poner null si ya venía expresada en gramos."),
        }),
      ),
    }),
  ),
});

export type DietPlanResponse = z.infer<typeof dietPlanSchema>;

const SYSTEM_PROMPT = `Eres un experto nutricionista. Tu tarea es extraer la información de un plan de dieta o menú a partir de un texto, imagen o PDF. Extrae los macronutrientes totales del día y cada comida con sus alimentos en gramos. Si la dieta no especifica calorías o macros totales, debes calcularlos sumando los valores nutricionales estimados de cada alimento.

Para cada alimento, si el texto original lo expresa en porciones o unidades domésticas (por ejemplo, "3 huevos", "2 rebanadas de pan", "1 taza de arroz"), debes guardar esa expresión exacta en 'serving_equivalence' y estimar su peso correspondiente en 'quantity_g'. Si el texto original ya venía expresado en gramos (por ejemplo, "150g de pechuga de pollo"), pon null o vacío en 'serving_equivalence'.

meal_type debe ser uno de: "desayuno", "almuerzo", "cena", "snack", "otro".`;

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
  try {
    if (!SUPPORTED_DIET_FILE_TYPES.has(mimeType)) {
      return {
        error: "Formato no soportado. Sube una imagen JPG, PNG, WebP o un PDF.",
      };
    }

    const estimatedFileSizeBytes = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedFileSizeBytes > MAX_DIET_FILE_SIZE_BYTES) {
      return {
        error: "El archivo es muy grande. Sube un archivo de 5 MB o menos.",
      };
    }

    const { object } = await generateObject({
      model: getGeminiModel(),
      schema: dietPlanSchema,
      schemaName: "diet_plan",
      schemaDescription:
        "Plan nutricional extraído desde una imagen o PDF de dieta.",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrae el plan de alimentación de este archivo. Si algún dato no aparece explícito, estímalos de forma razonable y conservadora.",
            },
            {
              type: "file",
              data: base64Data,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    return { data: object };
  } catch (error) {
    console.error("AI Parse Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Asegúrate de que el archivo sea claro e intenta de nuevo.";
    return { error: `Error al analizar: ${message}` };
  }
}

export async function saveDietTemplate(
  data: DietPlanResponse,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) {
    return { error: "No autenticado" };
  }

  // 1. Guardar Diet Template
  const { data: template, error: tError } = await supabase
    .from("diet_templates")
    .insert({
      user_id: userAuth.user.id,
      name: data.name || "Mi Dieta Importada",
      is_active: true,
      target_calories: data.target_calories,
      target_protein: data.target_protein,
      target_carbs: data.target_carbs,
      target_fat: data.target_fat,
    })
    .select()
    .single();

  if (tError) return { error: tError.message };

  // 2. Guardar Comidas
  for (const [i, meal] of data.meals.entries()) {
    const { data: mealRecord, error: mError } = await supabase
      .from("diet_template_meals")
      .insert({
        template_id: template.id,
        meal_type: meal.meal_type,
        name: meal.name,
        order_index: i,
      })
      .select()
      .single();

    if (mError) continue; // Si falla una comida, se salta

    // 3. (Opcional) Intentar encontrar los alimentos en la BD o dejarlos pendientes.
    // Para simplificar, la IA ya extrajo los "items", pero como requieren food_id,
    // tendremos que buscar el alimento más parecido.
    for (const item of meal.items) {
      // Buscar alimento genérico que coincida con el nombre
      const { data: foodMatch } = await supabase
        .from("foods")
        .select("id")
        .textSearch("name", item.name.split(" ").join(" | "))
        .limit(1)
        .maybeSingle();

      if (foodMatch) {
        await supabase.from("diet_template_items").insert({
          template_meal_id: mealRecord.id,
          food_id: foodMatch.id,
          quantity_g: item.quantity_g,
          serving_equivalence: item.serving_equivalence || null,
        });
      }
    }
  }

  return {};
}
