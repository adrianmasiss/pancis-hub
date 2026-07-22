/**
 * Sustitucion de una comida completa por una receta
 * (docs/02_PRODUCT_REQUIREMENTS.md 5.2).
 *
 * Cambiar toda la comida es distinto de cambiar un alimento: hay que
 * decidir CUANTAS porciones de la receta se acercan mas a lo planificado,
 * y despues explicar en que se parece y en que no, igual que con los
 * alimentos.
 */
import {
  compatibilityScore,
  type CompatibilityScore,
} from "@/features/foods/lib/equivalence";
import type { MacroSet } from "@/features/nutrition/lib/macros";

export type RecipeOption = {
  id: string;
  name: string;
  /** Macros de UNA porcion de la receta. */
  perServing: MacroSet;
  imageUrl: string | null;
};

export type RecipeMatch = {
  recipe: RecipeOption;
  /** Porciones sugeridas para acercarse a la comida original. */
  servings: number;
  /** Macros resultantes con esas porciones. */
  macros: MacroSet;
  /** Diferencia receta - comida original. */
  diff: MacroSet;
  compatibility: CompatibilityScore;
};

/** Se sugieren medias porciones: un cuarto de receta rara vez es practico. */
const SERVING_STEP = 0.5;
const MIN_SERVINGS = 0.5;
const MAX_SERVINGS = 4;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Porciones que mejor igualan la comida original.
 *
 * Se ancla en CALORIAS y no en un macro concreto: una comida completa
 * suele mezclar fuentes, asi que ningun macro representa su papel del
 * modo en que la proteina representa a un filete. Despues se acota a
 * medias porciones dentro de un rango razonable.
 */
export function suggestServings(
  mealMacros: MacroSet,
  perServing: MacroSet,
): number {
  if (perServing.calories <= 0) return 1;
  const raw = mealMacros.calories / perServing.calories;
  const rounded = Math.round(raw / SERVING_STEP) * SERVING_STEP;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, rounded));
}

/** Escala los macros de una porcion al numero de porciones elegido. */
export function scaleServings(
  perServing: MacroSet,
  servings: number,
): MacroSet {
  return {
    calories: Math.round(perServing.calories * servings),
    proteinG: round1(perServing.proteinG * servings),
    carbohydrateG: round1(perServing.carbohydrateG * servings),
    fatG: round1(perServing.fatG * servings),
    fiberG: round1(perServing.fiberG * servings),
  };
}

/**
 * Ordena las recetas por que tan bien sustituyen a la comida. La
 * compatibilidad usa el mismo motor que los intercambios de alimento, asi
 * que un 8/10 significa lo mismo en las dos pantallas.
 */
export function rankRecipeMatches(
  mealMacros: MacroSet,
  recipes: RecipeOption[],
  maxResults = 8,
): RecipeMatch[] {
  return recipes
    .filter((recipe) => recipe.perServing.calories > 0)
    .map((recipe) => {
      const servings = suggestServings(mealMacros, recipe.perServing);
      const macros = scaleServings(recipe.perServing, servings);
      return {
        recipe,
        servings,
        macros,
        diff: {
          calories: Math.round(macros.calories - mealMacros.calories),
          proteinG: round1(macros.proteinG - mealMacros.proteinG),
          carbohydrateG: round1(
            macros.carbohydrateG - mealMacros.carbohydrateG,
          ),
          fatG: round1(macros.fatG - mealMacros.fatG),
          fiberG: round1(macros.fiberG - mealMacros.fiberG),
        },
        // Una receta no pertenece a un grupo alimentario ni tiene estado
        // crudo/cocido, asi que no aplican esas penalizaciones.
        compatibility: compatibilityScore(mealMacros, macros),
      };
    })
    .sort((a, b) => b.compatibility.overall - a.compatibility.overall)
    .slice(0, maxResults);
}
