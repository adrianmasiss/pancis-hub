/**
 * Versionado de dietas (docs/02_PRODUCT_REQUIREMENTS.md 22).
 *
 * Una version es una FOTO COMPLETA e inmutable del plan. Guarda tambien
 * los nombres y macros del momento, no solo los identificadores: si un
 * alimento se elimina del catalogo o sus valores cambian, la version
 * sigue describiendo fielmente lo que el plan decia entonces.
 */
import type { MacroSet } from "@/features/nutrition/lib/macros";

export type VersionItem = {
  foodId: string;
  /** Nombre en el momento de guardar; el catalogo puede cambiar despues. */
  foodName: string;
  quantityG: number;
  servingEquivalence: string | null;
  /** Macros del alimento por 100 g cuando se guardo la version. */
  per100g: MacroSet;
};

export type VersionMeal = {
  name: string | null;
  mealType: string;
  orderIndex: number;
  scheduledTime: string | null;
  items: VersionItem[];
};

export type DietSnapshot = {
  name: string;
  targets: {
    calories: number;
    proteinG: number;
    carbohydrateG: number;
    fatG: number;
  };
  meals: VersionMeal[];
};

export type DietVersionSummary = {
  id: string;
  version: number;
  name: string;
  reason: string | null;
  createdAt: string;
  mealCount: number;
  itemCount: number;
  totalCalories: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Calorias totales del plan guardado en la foto. */
export function snapshotCalories(snapshot: DietSnapshot): number {
  let total = 0;
  for (const meal of snapshot.meals) {
    for (const item of meal.items) {
      total += (item.per100g.calories * item.quantityG) / 100;
    }
  }
  return Math.round(total);
}

export function snapshotItemCount(snapshot: DietSnapshot): number {
  return snapshot.meals.reduce((total, meal) => total + meal.items.length, 0);
}

export type VersionDifference = {
  /** Comidas presentes en la nueva y ausentes en la anterior. */
  addedMeals: string[];
  removedMeals: string[];
  /** Alimentos que cambiaron de cantidad, con el antes y el despues. */
  changedItems: {
    mealName: string;
    foodName: string;
    fromQuantityG: number;
    toQuantityG: number;
  }[];
  addedItems: { mealName: string; foodName: string }[];
  removedItems: { mealName: string; foodName: string }[];
  caloriesDelta: number;
};

function mealKey(meal: VersionMeal): string {
  return `${meal.mealType}:${meal.name ?? ""}`;
}

function mealLabel(meal: VersionMeal): string {
  return meal.name || meal.mealType;
}

/**
 * Que cambio entre dos versiones. Sirve para que el usuario decida si
 * restaurar sin tener que comparar dos listas a ojo.
 *
 * Las comidas se identifican por tipo y nombre, no por id: al restaurar
 * se crean filas nuevas, asi que los ids no sobreviven entre versiones.
 */
export function diffSnapshots(
  previous: DietSnapshot,
  current: DietSnapshot,
): VersionDifference {
  const previousMeals = new Map(previous.meals.map((m) => [mealKey(m), m]));
  const currentMeals = new Map(current.meals.map((m) => [mealKey(m), m]));

  const addedMeals: string[] = [];
  const removedMeals: string[] = [];
  const changedItems: VersionDifference["changedItems"] = [];
  const addedItems: VersionDifference["addedItems"] = [];
  const removedItems: VersionDifference["removedItems"] = [];

  for (const [key, meal] of currentMeals) {
    if (!previousMeals.has(key)) addedMeals.push(mealLabel(meal));
  }
  for (const [key, meal] of previousMeals) {
    if (!currentMeals.has(key)) removedMeals.push(mealLabel(meal));
  }

  for (const [key, currentMeal] of currentMeals) {
    const previousMeal = previousMeals.get(key);
    if (!previousMeal) continue;

    const previousItems = new Map(
      previousMeal.items.map((item) => [item.foodId, item]),
    );
    const currentItems = new Map(
      currentMeal.items.map((item) => [item.foodId, item]),
    );

    for (const [foodId, item] of currentItems) {
      const before = previousItems.get(foodId);
      if (!before) {
        addedItems.push({
          mealName: mealLabel(currentMeal),
          foodName: item.foodName,
        });
      } else if (round1(before.quantityG) !== round1(item.quantityG)) {
        changedItems.push({
          mealName: mealLabel(currentMeal),
          foodName: item.foodName,
          fromQuantityG: round1(before.quantityG),
          toQuantityG: round1(item.quantityG),
        });
      }
    }

    for (const [foodId, item] of previousItems) {
      if (!currentItems.has(foodId)) {
        removedItems.push({
          mealName: mealLabel(previousMeal),
          foodName: item.foodName,
        });
      }
    }
  }

  return {
    addedMeals,
    removedMeals,
    changedItems,
    addedItems,
    removedItems,
    caloriesDelta: snapshotCalories(current) - snapshotCalories(previous),
  };
}

/** true si la foto no aporta cambios respecto a la anterior. */
export function isIdenticalSnapshot(
  previous: DietSnapshot,
  current: DietSnapshot,
): boolean {
  const diff = diffSnapshots(previous, current);
  return (
    diff.addedMeals.length === 0 &&
    diff.removedMeals.length === 0 &&
    diff.changedItems.length === 0 &&
    diff.addedItems.length === 0 &&
    diff.removedItems.length === 0 &&
    previous.name === current.name
  );
}
