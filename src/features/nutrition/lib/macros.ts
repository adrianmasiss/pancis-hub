/**
 * Calculos puros de macros. Los alimentos del catalogo expresan sus
 * valores por 100 g; los items de comida guardan snapshots escalados a
 * la cantidad registrada (docs/DATABASE.md).
 */

export type MacroSet = {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

export type FoodMacrosPer100g = MacroSet;

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Escala macros por 100 g a una cantidad en gramos. */
export function scaleMacros(
  per100g: FoodMacrosPer100g,
  quantityG: number,
): MacroSet {
  const factor = quantityG / 100;
  return {
    calories: round1(per100g.calories * factor),
    proteinG: round1(per100g.proteinG * factor),
    carbohydrateG: round1(per100g.carbohydrateG * factor),
    fatG: round1(per100g.fatG * factor),
    fiberG: round1(per100g.fiberG * factor),
  };
}

export function sumMacros(sets: MacroSet[]): MacroSet {
  const total = sets.reduce(
    (acc, set) => ({
      calories: acc.calories + set.calories,
      proteinG: acc.proteinG + set.proteinG,
      carbohydrateG: acc.carbohydrateG + set.carbohydrateG,
      fatG: acc.fatG + set.fatG,
      fiberG: acc.fiberG + set.fiberG,
    }),
    { calories: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fiberG: 0 },
  );
  return {
    calories: Math.round(total.calories),
    proteinG: round1(total.proteinG),
    carbohydrateG: round1(total.carbohydrateG),
    fatG: round1(total.fatG),
    fiberG: round1(total.fiberG),
  };
}

/** Resta con piso en negativo permitido: el restante puede ser negativo si se excede. */
export function remainingMacros(
  target: MacroSet,
  consumed: MacroSet,
): MacroSet {
  return {
    calories: Math.round(target.calories - consumed.calories),
    proteinG: round1(target.proteinG - consumed.proteinG),
    carbohydrateG: round1(target.carbohydrateG - consumed.carbohydrateG),
    fatG: round1(target.fatG - consumed.fatG),
    fiberG: round1(target.fiberG - consumed.fiberG),
  };
}
