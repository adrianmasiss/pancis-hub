"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { getGeminiModel, hasGeminiApiKey } from "@/lib/ai/google";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  computeSwapImpact,
  equivalentQuantityByCalories,
  type SwapImpact,
} from "@/features/nutrition/lib/swap-impact";
import {
  scaleMacros,
  type FoodMacrosPer100g,
  type MacroSet,
} from "@/features/nutrition/lib/macros";

/**
 * "¿Que pasa si cambio este alimento por N g de X?"
 *
 * La cadena tiene un orden deliberado:
 *
 *   1. Se busca X en la biblioteca. Si esta, se responde con sus macros
 *      reales. Es exacto, instantaneo y no cuesta una llamada al modelo.
 *   2. Solo si no esta, se le piden los macros al modelo. Ahi es donde la IA
 *      aporta lo que la biblioteca no puede.
 *
 * En los dos casos el impacto lo calcula computeSwapImpact, nunca el modelo:
 * una estimacion puede fallar al decir cuanta proteina tiene un producto, y
 * eso se marca como estimacion; equivocarse en la resta seria presentar una
 * cifra falsa como exacta.
 */

export type SwapAnswerSource = "biblioteca" | "asistente";

export type SwapAnswer = {
  source: SwapAnswerSource;
  /** Nombre resuelto del sustituto. */
  toName: string;
  /** Id cuando viene de la biblioteca; null cuando lo estimo el modelo. */
  toFoodId: string | null;
  toPer100g: FoodMacrosPer100g;
  /** Solo cuando hay alimento de partida: sin origen no hay comparacion. */
  impact: SwapImpact | null;
  /** Macros del sustituto en la cantidad consultada. Siempre presente. */
  toMacros: MacroSet;
  /** Gramos del sustituto que igualarian las calorias del original. */
  equivalentQuantityG: number | null;
  /** Solo en estimaciones: aviso de que la cifra no es de catalogo. */
  estimateNotice?: string;
};

const questionSchema = z.object({
  /**
   * Alimento de partida. Es opcional a proposito: desde el plan del dia hay
   * uno concreto al que comparar, pero la barra suelta de Nutricion se usa
   * para consultar un alimento sin cambiar nada, y ahi no hay origen.
   */
  from: z
    .object({
      name: z.string().trim().min(1).max(120),
      per100g: z.object({
        calories: z.number().min(0),
        proteinG: z.number().min(0),
        carbohydrateG: z.number().min(0),
        fatG: z.number().min(0),
        fiberG: z.number().min(0),
      }),
      quantityG: z.number().positive().max(5000),
    })
    .optional(),
  /** Texto libre: "avena", "2 huevos", "pan bimbo integral". */
  toQuery: z.string().trim().min(1).max(120),
  toQuantityG: z.number().positive().max(5000),
});

/** Macros por 100 g estimados por el modelo, con su nivel de confianza. */
const estimateSchema = z.object({
  resolvedName: z
    .string()
    .describe("Nombre normalizado del producto, en espanol."),
  per100g: z.object({
    calories: z.number().min(0).max(900),
    proteinG: z.number().min(0).max(100),
    carbohydrateG: z.number().min(0).max(100),
    fatG: z.number().min(0).max(100),
    fiberG: z.number().min(0).max(100),
  }),
  confidence: z.enum(["baja", "media", "alta"]),
});

function buildAnswer(params: {
  source: SwapAnswerSource;
  toName: string;
  toFoodId: string | null;
  toPer100g: FoodMacrosPer100g;
  toQuantityG: number;
  from?: { per100g: FoodMacrosPer100g; quantityG: number };
  estimateNotice?: string;
}): SwapAnswer {
  const { from, toPer100g, toQuantityG } = params;
  return {
    source: params.source,
    toName: params.toName,
    toFoodId: params.toFoodId,
    toPer100g,
    toMacros: scaleMacros(toPer100g, toQuantityG),
    impact: from
      ? computeSwapImpact({
          fromPer100g: from.per100g,
          fromQuantityG: from.quantityG,
          toPer100g,
          toQuantityG,
        })
      : null,
    equivalentQuantityG: from
      ? equivalentQuantityByCalories({
          fromPer100g: from.per100g,
          fromQuantityG: from.quantityG,
          toPer100g,
        })
      : null,
    estimateNotice: params.estimateNotice,
  };
}

export async function answerSwapQuestion(
  input: unknown,
): Promise<{ error: string } | { answer: SwapAnswer }> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };

  const { from, toQuery, toQuantityG } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  // --- 1. Biblioteca primero -------------------------------------------
  const { data: matches } = await supabase
    .from("foods")
    .select("id, name, calories, protein_g, carbohydrate_g, fat_g, fiber_g")
    .or(`owner_user_id.is.null,owner_user_id.eq.${user.id}`)
    .ilike("name", `%${toQuery.replace(/[%_]/g, "")}%`)
    .limit(1);

  const match = matches?.[0];
  if (match) {
    const toPer100g: FoodMacrosPer100g = {
      calories: Number(match.calories),
      proteinG: Number(match.protein_g),
      carbohydrateG: Number(match.carbohydrate_g),
      fatG: Number(match.fat_g),
      fiberG: Number(match.fiber_g ?? 0),
    };
    return {
      answer: buildAnswer({
        source: "biblioteca",
        toName: match.name,
        toFoodId: match.id,
        toPer100g,
        toQuantityG,
        from: from ? { per100g: from.per100g, quantityG: from.quantityG } : undefined,
      }),
    };
  }

  // --- 2. No esta en la biblioteca: aqui entra el modelo ----------------
  if (!hasGeminiApiKey()) {
    return { error: messages.nutrition.swapQuestion.noEstimateAvailable };
  }

  try {
    const { object } = await generateObject({
      model: getGeminiModel(),
      schema: estimateSchema,
      schemaName: "food_macro_estimate",
      schemaDescription:
        "Macronutrientes por 100 g de un alimento que no esta en el catalogo.",
      system: [
        "Eres un motor de estimacion nutricional para una app de nutricion.",
        "Devuelves macronutrientes por 100 g de producto, en espanol.",
        "Usa valores tipicos de tablas de composicion de alimentos.",
        "Si el producto es una marca concreta que no conoces, estima a partir",
        "de su categoria generica y baja la confianza.",
        "No inventes precision: la confianza debe reflejar cuanto sabes.",
      ].join(" "),
      prompt: `Producto consultado: "${toQuery}"`,
    });

    const toPer100g: FoodMacrosPer100g = object.per100g;
    return {
      answer: buildAnswer({
        source: "asistente",
        toName: object.resolvedName,
        toFoodId: null,
        toPer100g,
        toQuantityG,
        from: from ? { per100g: from.per100g, quantityG: from.quantityG } : undefined,
        estimateNotice:
          messages.nutrition.swapQuestion.estimateNotice[object.confidence],
      }),
    };
  } catch (error) {
    console.error("Swap estimate error:", error);
    return { error: messages.nutrition.swapQuestion.estimateFailed };
  }
}
