/**
 * Motor de equivalencias de alimentos (docs/02_PRODUCT_REQUIREMENTS.md 5.4).
 *
 * Formula de puntaje (menor = mas similar), documentada en docs/DECISIONS.md:
 *
 *   score = wCal   x |dif calorias|
 *         + wProt  x |dif proteina|
 *         + wCarb  x |dif carbohidratos|
 *         + wGrasa x |dif grasas|
 *         + wFibra x |dif fibra|
 *         + penalizacion por grupo distinto
 *         + penalizacion por estado (crudo/cocido) distinto
 *         - bono por favorito
 *         - bono por uso reciente
 *
 * Las diferencias se calculan entre la porcion original y la porcion
 * equivalente sugerida. La cantidad equivalente iguala el "macro ancla"
 * del grupo del alimento original (carbohidratos para un carbohidrato,
 * proteina para una proteina, etc.), porque ese es el rol que la comida
 * cumple en el plan. Los resultados son APROXIMACIONES, nunca se
 * presentan como equivalencias exactas.
 */
import { scaleMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import type { FoodGroup } from "@/features/foods/schemas";

export type EquivalenceFood = {
  id: string;
  name: string;
  foodGroup: FoodGroup;
  cookedState: "crudo" | "cocido" | null;
  per100g: MacroSet;
};

export type SwapCandidate = {
  food: EquivalenceFood;
  suggestedQuantityG: number;
  macros: MacroSet;
  /** Diferencia alternativa - original (positivo = la alternativa aporta mas). */
  diff: MacroSet;
  sameGroup: boolean;
  isFavorite: boolean;
  isRecent: boolean;
  score: number;
};

/** Pesos por unidad de diferencia (1 kcal, 1 g). */
export const MACRO_WEIGHTS = {
  calories: 1,
  proteinG: 10,
  carbohydrateG: 4,
  fatG: 6,
  fiberG: 2,
} as const;

export const PENALTIES = {
  differentGroup: 120,
  differentCookedState: 15,
  favoriteBonus: 12,
  recentBonus: 6,
} as const;

const MIN_QUANTITY_G = 5;
const MAX_QUANTITY_G = 1500;

type AnchorMacro = keyof MacroSet;

/** Macro que define el rol del alimento en el plan segun su grupo. */
export function anchorMacroForGroup(group: FoodGroup): AnchorMacro {
  switch (group) {
    case "proteina":
      return "proteinG";
    case "carbohidrato":
    case "fruta":
    case "legumbre":
      return "carbohydrateG";
    case "grasa":
      return "fatG";
    default:
      return "calories";
  }
}

/**
 * Cantidad de la alternativa que iguala el macro ancla de la porcion
 * original. Si la alternativa casi no aporta ese macro, se iguala por
 * calorias. Redondeada a 5 g y acotada a un rango razonable.
 */
export function equivalentQuantity(
  source: EquivalenceFood,
  sourceQuantityG: number,
  target: EquivalenceFood,
): number {
  let anchor = anchorMacroForGroup(source.foodGroup);
  if (target.per100g[anchor] < 1) anchor = "calories";
  if (target.per100g[anchor] < 1) return sourceQuantityG;

  const sourceAmount = (source.per100g[anchor] * sourceQuantityG) / 100;
  const raw = (sourceAmount / target.per100g[anchor]) * 100;
  const rounded = Math.round(raw / 5) * 5;
  return Math.min(MAX_QUANTITY_G, Math.max(MIN_QUANTITY_G, rounded));
}

export function nutritionalDistance(a: MacroSet, b: MacroSet): number {
  return (
    MACRO_WEIGHTS.calories * Math.abs(a.calories - b.calories) +
    MACRO_WEIGHTS.proteinG * Math.abs(a.proteinG - b.proteinG) +
    MACRO_WEIGHTS.carbohydrateG * Math.abs(a.carbohydrateG - b.carbohydrateG) +
    MACRO_WEIGHTS.fatG * Math.abs(a.fatG - b.fatG) +
    MACRO_WEIGHTS.fiberG * Math.abs(a.fiberG - b.fiberG)
  );
}

/**
 * Coincidencia simple de alergias/restricciones por nombre: si el valor
 * declarado aparece en el nombre del alimento, se excluye. Es deliberadamente
 * conservador y no sustituye la revision del usuario.
 */
export function matchesRestriction(
  foodName: string,
  restrictions: string[],
): boolean {
  const name = foodName.toLowerCase();
  return restrictions.some((restriction) => {
    const value = restriction.trim().toLowerCase();
    return value.length > 1 && name.includes(value);
  });
}

export type RankInput = {
  source: EquivalenceFood;
  sourceQuantityG: number;
  candidates: EquivalenceFood[];
  favoriteIds: Set<string>;
  recentIds: Set<string>;
  restrictions: string[];
  maxResults?: number;
};

export function rankAlternatives({
  source,
  sourceQuantityG,
  candidates,
  favoriteIds,
  recentIds,
  restrictions,
  maxResults = 8,
}: RankInput): SwapCandidate[] {
  const sourceMacros = scaleMacros(source.per100g, sourceQuantityG);

  const round1 = (value: number) => Math.round(value * 10) / 10;

  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .filter((candidate) => !matchesRestriction(candidate.name, restrictions))
    .map((candidate) => {
      const suggestedQuantityG = equivalentQuantity(
        source,
        sourceQuantityG,
        candidate,
      );
      const macros = scaleMacros(candidate.per100g, suggestedQuantityG);
      const sameGroup = candidate.foodGroup === source.foodGroup;
      const sameState =
        source.cookedState === null ||
        candidate.cookedState === null ||
        candidate.cookedState === source.cookedState;
      const isFavorite = favoriteIds.has(candidate.id);
      const isRecent = recentIds.has(candidate.id);

      const score =
        nutritionalDistance(sourceMacros, macros) +
        (sameGroup ? 0 : PENALTIES.differentGroup) +
        (sameState ? 0 : PENALTIES.differentCookedState) -
        (isFavorite ? PENALTIES.favoriteBonus : 0) -
        (isRecent ? PENALTIES.recentBonus : 0);

      return {
        food: candidate,
        suggestedQuantityG,
        macros,
        diff: {
          calories: Math.round(macros.calories - sourceMacros.calories),
          proteinG: round1(macros.proteinG - sourceMacros.proteinG),
          carbohydrateG: round1(
            macros.carbohydrateG - sourceMacros.carbohydrateG,
          ),
          fatG: round1(macros.fatG - sourceMacros.fatG),
          fiberG: round1(macros.fiberG - sourceMacros.fiberG),
        },
        sameGroup,
        isFavorite,
        isRecent,
        score: Math.round(score * 10) / 10,
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);
}
