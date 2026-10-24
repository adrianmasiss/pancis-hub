import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";

/** «1.717»: kcal redondeadas, con separador de miles. */
export const kcal = (n: number) =>
  Math.round(n).toLocaleString("es-CR").replace(/\s/g, ".");

/** Gramos de un macro: sin decimales a partir de 10, uno por debajo. */
export const gramos = (n: number) =>
  (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString("es-CR");

/** «0,75»: litros con coma y hasta dos decimales. */
export const litros = (ml: number) =>
  (ml / 1000).toLocaleString("es-CR", { maximumFractionDigits: 2 });

export function mealLabel(mealType: string, name?: string | null): string {
  const tipo =
    messages.nutrition.mealTypes[
      mealType as keyof typeof messages.nutrition.mealTypes
    ] ?? "Comida";
  return name?.trim() || tipo;
}

export function mealTypeLabel(mealType: string): string {
  return (
    messages.nutrition.mealTypes[
      mealType as keyof typeof messages.nutrition.mealTypes
    ] ?? "Comida"
  );
}

export const MACROS: {
  key: keyof Omit<MacroSet, "calories">;
  label: string;
  short: string;
  color: string;
}[] = [
  {
    key: "proteinG",
    label: "Proteína",
    short: "Prot.",
    color: "var(--m-protein)",
  },
  {
    key: "carbohydrateG",
    label: "Carbohidratos",
    short: "Carbs",
    color: "var(--m-carbs)",
  },
  { key: "fatG", label: "Grasas", short: "Grasas", color: "var(--m-fat)" },
  { key: "fiberG", label: "Fibra", short: "Fibra", color: "var(--m-fiber)" },
];

export function addMacros(a: MacroSet, b: MacroSet, sign = 1): MacroSet {
  return {
    calories: a.calories + sign * b.calories,
    proteinG: a.proteinG + sign * b.proteinG,
    carbohydrateG: a.carbohydrateG + sign * b.carbohydrateG,
    fatG: a.fatG + sign * b.fatG,
    fiberG: a.fiberG + sign * b.fiberG,
  };
}

export function per100(
  food: {
    calories: number;
    proteinG: number;
    carbohydrateG: number;
    fatG: number;
    fiberG: number;
  },
  grams: number,
): MacroSet {
  const f = grams / 100;
  return {
    calories: food.calories * f,
    proteinG: food.proteinG * f,
    carbohydrateG: food.carbohydrateG * f,
    fatG: food.fatG * f,
    fiberG: food.fiberG * f,
  };
}
