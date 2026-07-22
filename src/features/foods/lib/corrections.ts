/**
 * Capa de correccion de alimentos por usuario
 * (docs/02_PRODUCT_REQUIREMENTS.md 7.5).
 *
 * Los alimentos del catalogo son compartidos y no se editan: cambiarlos
 * afectaria a todos. En su lugar, cada usuario puede guardar una
 * correccion que se superpone AL LEER, dejando intacto el dato original.
 *
 * Solo se corrigen los campos que el usuario toco. Los demas siguen
 * heredando el catalogo, asi que si la fuente arregla su dato mas
 * adelante, el usuario se beneficia sin tener que hacer nada.
 */

/** Campos que un usuario puede corregir de un alimento. */
export type FoodCorrection = {
  name: string | null;
  calories: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fiberG: number | null;
  cookedState: "crudo" | "cocido" | null;
  reason: string | null;
};

/** Forma minima de alimento sobre la que se aplica una correccion. */
export type CorrectableFood = {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
  cookedState: "crudo" | "cocido" | null;
};

export type CorrectedFood<T extends CorrectableFood> = T & {
  /** true si el usuario cambio al menos un campo de este alimento. */
  isCorrected: boolean;
};

/** Un valor corregido cuenta solo si no es null ni undefined. */
function pick<T>(corrected: T | null | undefined, original: T): T {
  return corrected === null || corrected === undefined ? original : corrected;
}

/**
 * Devuelve el alimento con la correccion del usuario aplicada. Sin
 * correccion devuelve el original marcado como no corregido.
 */
export function applyCorrection<T extends CorrectableFood>(
  food: T,
  correction: FoodCorrection | undefined | null,
): CorrectedFood<T> {
  if (!correction) return { ...food, isCorrected: false };

  const corrected = {
    ...food,
    name: pick(correction.name, food.name),
    calories: pick(correction.calories, food.calories),
    proteinG: pick(correction.proteinG, food.proteinG),
    carbohydrateG: pick(correction.carbohydrateG, food.carbohydrateG),
    fatG: pick(correction.fatG, food.fatG),
    fiberG: pick(correction.fiberG, food.fiberG),
    // El estado crudo/cocido solo se sobreescribe si el usuario lo fijo:
    // null en la correccion significa "no lo toque", no "borralo".
    cookedState: pick(correction.cookedState, food.cookedState),
  };

  return { ...corrected, isCorrected: hasChanges(food, correction) };
}

/**
 * true si la correccion cambia algo respecto al original. Una correccion
 * cuyos valores coinciden con el catalogo no se marca como corregida:
 * mostrar la etiqueta sin diferencia real solo confunde.
 */
export function hasChanges(
  food: CorrectableFood,
  correction: FoodCorrection,
): boolean {
  const comparisons: [unknown, unknown][] = [
    [correction.name, food.name],
    [correction.calories, food.calories],
    [correction.proteinG, food.proteinG],
    [correction.carbohydrateG, food.carbohydrateG],
    [correction.fatG, food.fatG],
    [correction.fiberG, food.fiberG],
    [correction.cookedState, food.cookedState],
  ];
  return comparisons.some(
    ([corrected, original]) =>
      corrected !== null && corrected !== undefined && corrected !== original,
  );
}

/** Aplica un mapa de correcciones a una lista de alimentos. */
export function applyCorrections<T extends CorrectableFood>(
  foods: T[],
  corrections: Map<string, FoodCorrection>,
): CorrectedFood<T>[] {
  return foods.map((food) => applyCorrection(food, corrections.get(food.id)));
}
