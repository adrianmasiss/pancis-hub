import {
  scaleMacros,
  type FoodMacrosPer100g,
  type MacroSet,
} from "@/features/nutrition/lib/macros";

export type SwapImpact = {
  /** Macros del alimento original en su cantidad original. */
  from: MacroSet;
  /** Macros del sustituto en la cantidad consultada. */
  to: MacroSet;
  /** Diferencia del sustituto menos el original. */
  delta: MacroSet;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Calcula el impacto de cambiar un alimento por otro en una cantidad dada.
 *
 * Es aritmetica pura y deterministica: cuando ambos alimentos tienen macros
 * conocidos no hace falta preguntarle a un modelo. La IA solo interviene antes
 * de este punto, para *obtener* los macros de un producto que no esta en la
 * biblioteca; el calculo nunca se delega, porque un modelo puede equivocarse
 * en una resta y aqui la cifra tiene que ser exacta.
 *
 * El delta se calcula sobre las cifras ya redondeadas, no sobre las crudas, a
 * proposito: el usuario ve "248" y "311" en pantalla, y el cambio que se le
 * muestra tiene que ser exactamente la diferencia entre esos dos numeros. Un
 * delta mas preciso pero que no cuadre con lo que esta leyendo se percibe como
 * un error de la aplicacion.
 */
export function computeSwapImpact(params: {
  fromPer100g: FoodMacrosPer100g;
  fromQuantityG: number;
  toPer100g: FoodMacrosPer100g;
  toQuantityG: number;
}): SwapImpact {
  const from = scaleMacros(params.fromPer100g, params.fromQuantityG);
  const to = scaleMacros(params.toPer100g, params.toQuantityG);

  return {
    from,
    to,
    delta: {
      calories: round1(to.calories - from.calories),
      proteinG: round1(to.proteinG - from.proteinG),
      carbohydrateG: round1(to.carbohydrateG - from.carbohydrateG),
      fatG: round1(to.fatG - from.fatG),
      fiberG: round1(to.fiberG - from.fiberG),
    },
  };
}

/**
 * Cantidad del sustituto que iguala las calorias del original.
 *
 * Es la respuesta a "¿cuanto tendria que comer para que salga igual?", que es
 * la pregunta que sigue casi siempre a ver el impacto.
 */
export function equivalentQuantityByCalories(params: {
  fromPer100g: FoodMacrosPer100g;
  fromQuantityG: number;
  toPer100g: FoodMacrosPer100g;
}): number | null {
  if (params.toPer100g.calories <= 0) return null;
  const targetCalories =
    params.fromPer100g.calories * (params.fromQuantityG / 100);
  return Math.round((targetCalories / params.toPer100g.calories) * 100);
}
