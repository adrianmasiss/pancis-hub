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

/** Puntuacion 0-10 por macro y global, para mostrar al usuario. */
export type CompatibilityScore = {
  overall: number;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
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
  compatibility: CompatibilityScore;
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

/**
 * Peso de cada macro en la puntuacion global de compatibilidad. La
 * proteina pesa mas porque es el macro que el usuario menos quiere perder
 * al sustituir, y la fibra menos porque es el mas facil de recuperar en
 * otra comida.
 */
export const COMPATIBILITY_WEIGHTS = {
  calories: 0.25,
  proteinG: 0.35,
  carbohydrateG: 0.15,
  fatG: 0.15,
  fiberG: 0.1,
} as const;

/**
 * Piso por macro para no castigar diferencias irrelevantes en cantidades
 * minimas: pasar de 1 g a 2 g de grasa duplica el valor, pero no cambia
 * nada del plan. Sin este piso, la division daria un error del 100 %.
 */
const COMPATIBILITY_FLOORS = {
  calories: 40,
  proteinG: 5,
  carbohydrateG: 5,
  fatG: 3,
  fiberG: 2,
} as const;

/** Puntos que se descuentan de la nota global. */
export const COMPATIBILITY_PENALTIES = {
  differentGroup: 1.5,
  differentCookedState: 0.5,
} as const;

const clamp10 = (value: number) => Math.min(10, Math.max(0, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Nota 0-10 de un macro: 10 cuando la alternativa aporta lo mismo, 0
 * cuando se desvia el 100 % o mas respecto al original.
 */
function macroScore(
  source: number,
  candidate: number,
  floor: number,
): number {
  const base = Math.max(Math.abs(source), floor);
  const relativeError = Math.abs(candidate - source) / base;
  return clamp10(10 * (1 - relativeError));
}

/**
 * Puntuacion de compatibilidad de una sustitucion, en 0-10 por macro y
 * global (docs/DECISIONS.md). Es una APROXIMACION orientativa: resume que
 * tan cerca queda la alternativa del aporte original, nunca afirma que
 * sean equivalentes.
 */
export function compatibilityScore(
  source: MacroSet,
  candidate: MacroSet,
  options?: { sameGroup?: boolean; sameCookedState?: boolean },
): CompatibilityScore {
  const perMacro = {
    calories: macroScore(
      source.calories,
      candidate.calories,
      COMPATIBILITY_FLOORS.calories,
    ),
    proteinG: macroScore(
      source.proteinG,
      candidate.proteinG,
      COMPATIBILITY_FLOORS.proteinG,
    ),
    carbohydrateG: macroScore(
      source.carbohydrateG,
      candidate.carbohydrateG,
      COMPATIBILITY_FLOORS.carbohydrateG,
    ),
    fatG: macroScore(source.fatG, candidate.fatG, COMPATIBILITY_FLOORS.fatG),
    fiberG: macroScore(
      source.fiberG,
      candidate.fiberG,
      COMPATIBILITY_FLOORS.fiberG,
    ),
  };

  const weighted =
    perMacro.calories * COMPATIBILITY_WEIGHTS.calories +
    perMacro.proteinG * COMPATIBILITY_WEIGHTS.proteinG +
    perMacro.carbohydrateG * COMPATIBILITY_WEIGHTS.carbohydrateG +
    perMacro.fatG * COMPATIBILITY_WEIGHTS.fatG +
    perMacro.fiberG * COMPATIBILITY_WEIGHTS.fiberG;

  const penalties =
    (options?.sameGroup === false ? COMPATIBILITY_PENALTIES.differentGroup : 0) +
    (options?.sameCookedState === false
      ? COMPATIBILITY_PENALTIES.differentCookedState
      : 0);

  return {
    overall: round1(clamp10(weighted - penalties)),
    calories: round1(perMacro.calories),
    proteinG: round1(perMacro.proteinG),
    carbohydrateG: round1(perMacro.carbohydrateG),
    fatG: round1(perMacro.fatG),
    fiberG: round1(perMacro.fiberG),
  };
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
        compatibility: compatibilityScore(sourceMacros, macros, {
          sameGroup,
          sameCookedState: sameState,
        }),
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);
}

/**
 * Calcula y formatea la equivalencia en porciones domésticas para una cantidad en gramos dada.
 * Por ejemplo: 150g de huevo (donde 1 unidad = 50g) -> "3 unidades".
 */
export function formatHouseholdEquivalence(
  quantityG: number,
  portions: { label: string; grams: number }[],
): string | null {
  if (!portions || portions.length === 0 || quantityG <= 0) return null;

  // Encontrar la porción disponible.
  const portion = portions[0];
  if (!portion || portion.grams <= 0) return null;

  const ratio = quantityG / portion.grams;

  // Redondear a 1 decimal o a un número entero si está muy cerca.
  let value = Math.round(ratio * 10) / 10;
  if (Math.abs(value - Math.round(value)) < 0.05) {
    value = Math.round(value);
  }

  const label = portion.label.trim();
  // Busca un número al inicio, ej. "1 unidad", "1.5 tazas"
  const match = label.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);

  if (match && match[1] && match[2]) {
    const baseNumber = parseFloat(match[1]);
    const unit = match[2];
    const totalCount = value * baseNumber;

    // Formatear el número total
    let totalCountStr: string;
    if (Math.abs(totalCount - Math.round(totalCount)) < 0.01) {
      totalCountStr = String(Math.round(totalCount));
    } else {
      totalCountStr = totalCount.toFixed(1);
    }

    // Pluralizar unidades en español si es mayor que 1
    let pluralizedUnit = unit;
    if (totalCount > 1) {
      if (unit === "unidad") pluralizedUnit = "unidades";
      else if (unit === "rebanada") pluralizedUnit = "rebanadas";
      else if (unit === "taza") pluralizedUnit = "tazas";
      else if (unit === "cucharada") pluralizedUnit = "cucharadas";
      else if (unit === "envase") pluralizedUnit = "envases";
      else if (unit === "porcion") pluralizedUnit = "porciones";
      else if (unit === "porción") pluralizedUnit = "porciones";
      else if (unit === "pieza") pluralizedUnit = "piezas";
      else if (unit === "plato") pluralizedUnit = "platos";
      else if (unit === "vaso") pluralizedUnit = "vasos";
      else if (unit.endsWith("a") || unit.endsWith("e") || unit.endsWith("o"))
        pluralizedUnit = unit + "s";
      else if (unit.endsWith("n")) pluralizedUnit = unit + "es";
    }

    return `${totalCountStr} ${pluralizedUnit}`;
  }

  // Si no coincide con el regex, e.g. "Un envase entero"
  let valueStr: string;
  if (Math.abs(value - Math.round(value)) < 0.01) {
    valueStr = String(Math.round(value));
  } else {
    valueStr = value.toFixed(1);
  }
  return `${valueStr} x ${label}`;
}
