import { sumMacros, type MacroSet } from "./macros";

export function isMealConsumed(status: string): boolean {
  return status === "completada" || status === "completada_con_cambios";
}

export function consumedTotals(
  meals: { status: string; totals: MacroSet }[],
): MacroSet {
  return sumMacros(
    meals
      .filter((meal) => isMealConsumed(meal.status))
      .map((meal) => meal.totals),
  );
}

export function pendingPlanTotals(
  meals: { loggedToday: boolean; totals: MacroSet }[],
): MacroSet {
  return sumMacros(
    meals.filter((meal) => !meal.loggedToday).map((meal) => meal.totals),
  );
}

export function resolveNutritionDate(value: unknown, today: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return today;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
    ? value
    : today;
}
