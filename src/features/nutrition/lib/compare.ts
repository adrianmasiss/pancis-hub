/**
 * La aritmética del comparador.
 *
 * Estaba escrita dentro del componente, entre el JSX, y por eso no se podía
 * probar sin montar media pantalla. Aquí no hay nada de React: entran números
 * y salen números.
 */

import type { MacroSet } from "@/features/nutrition/lib/macros";

/** Los cinco nutrientes que el comparador alinea, en orden de lectura. */
export const COMPARED_MACROS = [
  "calories",
  "proteinG",
  "carbohydrateG",
  "fatG",
  "fiberG",
] as const;

export type ComparedMacro = (typeof COMPARED_MACROS)[number];

/** Un alimento del catálogo, siempre por 100 g. */
export type Per100g = {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

/**
 * Lo que aporta una cantidad concreta de un alimento.
 *
 * Las calorías se redondean a entero y los gramos a un decimal: es la
 * precisión que la fuente sostiene. Dar 32,47 g de proteína sugiere una
 * exactitud que ninguna etiqueta tiene.
 */
export function scalePortion(food: Per100g, quantityG: number): MacroSet {
  const factor = quantityG / 100;
  const unDecimal = (value: number) => Math.round(value * factor * 10) / 10;
  return {
    calories: Math.round(food.calories * factor),
    proteinG: unDecimal(food.proteinG),
    carbohydrateG: unDecimal(food.carbohydrateG),
    fatG: unDecimal(food.fatG),
    fiberG: unDecimal(food.fiberG),
  };
}

/** B menos A, nutriente a nutriente. */
export function macroDifference(a: MacroSet, b: MacroSet): MacroSet {
  return {
    calories: Math.round(b.calories - a.calories),
    proteinG: Math.round((b.proteinG - a.proteinG) * 10) / 10,
    carbohydrateG: Math.round((b.carbohydrateG - a.carbohydrateG) * 10) / 10,
    fatG: Math.round((b.fatG - a.fatG) * 10) / 10,
    fiberG: Math.round((b.fiberG - a.fiberG) * 10) / 10,
  };
}

export type CompareVerdict = "similar" | "mas" | "menos";

/**
 * Si el cambio importa, en una palabra.
 *
 * El umbral es RELATIVO y no absoluto a propósito: 40 kcal arriba son ruido en
 * un almuerzo de 700 y una quinta parte de una merienda de 200. Compararlo
 * contra el tamaño de lo que se cambia es lo único que da la misma respuesta
 * en los dos casos.
 */
export function compareVerdict(
  totalsA: MacroSet,
  difference: MacroSet,
  threshold = 0.08,
): CompareVerdict {
  const relativo =
    totalsA.calories > 0
      ? Math.abs(difference.calories) / totalsA.calories
      : difference.calories === 0
        ? 0
        : Infinity;
  if (relativo < threshold) return "similar";
  return difference.calories > 0 ? "mas" : "menos";
}
