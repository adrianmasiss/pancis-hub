/**
 * Macros de recetas calculados desde los ingredientes (docs/02, seccion 5.5).
 * Los valores por 100 g provienen del catalogo de alimentos.
 */
import {
  scaleMacros,
  sumMacros,
  type MacroSet,
} from "@/features/nutrition/lib/macros";

export type RecipeIngredientMacros = {
  per100g: MacroSet;
  quantityG: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Totales de la receta completa. */
export function recipeTotals(ingredients: RecipeIngredientMacros[]): MacroSet {
  return sumMacros(
    ingredients.map((ingredient) =>
      scaleMacros(ingredient.per100g, ingredient.quantityG),
    ),
  );
}

/** Macros por porcion. */
export function perServing(totals: MacroSet, servings: number): MacroSet {
  const safeServings = servings > 0 ? servings : 1;
  return {
    calories: Math.round(totals.calories / safeServings),
    proteinG: round1(totals.proteinG / safeServings),
    carbohydrateG: round1(totals.carbohydrateG / safeServings),
    fatG: round1(totals.fatG / safeServings),
    fiberG: round1(totals.fiberG / safeServings),
  };
}

/**
 * Escala las cantidades de ingredientes para un numero de porciones
 * distinto al de la receta (por ejemplo, cocinar 2 de una receta de 4).
 */
export function scaleIngredientsToServings(
  ingredients: { quantityG: number }[],
  recipeServings: number,
  desiredServings: number,
): number[] {
  const factor =
    recipeServings > 0 ? desiredServings / recipeServings : desiredServings;
  return ingredients.map((ingredient) => round1(ingredient.quantityG * factor));
}
