import { z } from "zod";
import {
  compatibilityScore,
  profileForGroup,
} from "@/features/foods/lib/equivalence";
import { scaleMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import {
  DEFAULT_TOLERANCES,
  evaluateTolerances,
  type MacroTolerances,
} from "@/features/nutrition/lib/tolerances";
import { getSourcesForFormula } from "@/server/tools/evidence";
import {
  proposalResult,
  readResult,
  type ProposalResult,
  type ReadResult,
} from "@/server/tools/types";

/**
 * Herramientas nutricionales del copiloto.
 *
 * Ninguna calcula: todas envuelven motores que ya existen y ya tienen pruebas.
 * `compatibilityScore` y `evaluateTolerances` son los mismos que usa la
 * interfaz, asi que el asistente y la pantalla no pueden discrepar.
 *
 * SERVER-ONLY.
 */

export const compareFoodsInput = z.object({
  original: z.object({
    name: z.string(),
    quantityG: z.number().positive(),
    per100g: z.object({
      calories: z.number().min(0),
      proteinG: z.number().min(0),
      carbohydrateG: z.number().min(0),
      fatG: z.number().min(0),
      fiberG: z.number().min(0),
    }),
    foodGroup: z.string(),
  }),
  substitute: z.object({
    name: z.string(),
    quantityG: z.number().positive(),
    per100g: z.object({
      calories: z.number().min(0),
      proteinG: z.number().min(0),
      carbohydrateG: z.number().min(0),
      fatG: z.number().min(0),
      fiberG: z.number().min(0),
    }),
    foodGroup: z.string(),
  }),
});

export type CompareFoodsInput = z.infer<typeof compareFoodsInput>;

export type FoodComparison = {
  originalMacros: MacroSet;
  substituteMacros: MacroSet;
  difference: MacroSet;
  compatibility: ReturnType<typeof compatibilityScore>;
  toleranceReport: ReturnType<typeof evaluateTolerances>;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Compara dos alimentos: cuanto cambia el aporte y si se mantiene dentro de
 * las tolerancias del usuario.
 *
 * Es LECTURA: comparar no modifica nada.
 */
export async function compareFoods(
  input: CompareFoodsInput,
  tolerances: MacroTolerances = DEFAULT_TOLERANCES,
): Promise<ReadResult<FoodComparison>> {
  const { original, substitute } = input;

  const originalMacros = scaleMacros(original.per100g, original.quantityG);
  const substituteMacros = scaleMacros(substitute.per100g, substitute.quantityG);

  const difference: MacroSet = {
    calories: Math.round(substituteMacros.calories - originalMacros.calories),
    proteinG: round1(substituteMacros.proteinG - originalMacros.proteinG),
    carbohydrateG: round1(
      substituteMacros.carbohydrateG - originalMacros.carbohydrateG,
    ),
    fatG: round1(substituteMacros.fatG - originalMacros.fatG),
    fiberG: round1(substituteMacros.fiberG - originalMacros.fiberG),
  };

  const compatibility = compatibilityScore(originalMacros, substituteMacros, {
    sameGroup: original.foodGroup === substitute.foodGroup,
    profile: profileForGroup(
      original.foodGroup as Parameters<typeof profileForGroup>[0],
    ),
  });

  const toleranceReport = evaluateTolerances(
    originalMacros,
    substituteMacros,
    tolerances,
  );

  const { sources } = await getSourcesForFormula("compatibility_profiles");

  return readResult(
    {
      originalMacros,
      substituteMacros,
      difference,
      compatibility,
      toleranceReport,
    },
    {
      sources,
      caveats: [
        "La compatibilidad es una aproximacion orientativa para ordenar alternativas, no una equivalencia exacta.",
        ...(toleranceReport.exceeded.length > 0
          ? [
              `Se sale de la tolerancia en: ${toleranceReport.exceeded.join(", ")}.`,
            ]
          : []),
      ],
    },
  );
}

export const proposeDaySwapInput = z.object({
  templateItemId: z.uuid(),
  date: z.iso.date(),
  foodId: z.uuid(),
  foodName: z.string(),
  quantityG: z.number().positive().max(5000),
});

export type ProposeDaySwapInput = z.infer<typeof proposeDaySwapInput>;

/**
 * Propone sustituir un alimento SOLO POR HOY.
 *
 * NO ESCRIBE, y no puede hacerlo: esta funcion no recibe cliente de base de
 * datos. Devuelve una propuesta que la interfaz muestra y que solo se aplica
 * si el usuario confirma, llamando a `swapDietItemForDay`. Es RF-013
 * garantizado por construccion y no por convencion.
 */
export function proposeDaySwap(
  input: ProposeDaySwapInput,
): ProposalResult<ProposeDaySwapInput> {
  return proposalResult(
    `Cambiar por ${input.quantityG} g de ${input.foodName}, solo por hoy. Tu plan no cambia.`,
    input,
    "features/nutrition/day-swap-actions#swapDietItemForDay",
    {
      caveats: [
        "Requiere que lo confirmes. El asistente no modifica tu plan por su cuenta.",
      ],
    },
  );
}
