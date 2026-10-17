import type { MacroSet } from "@/features/nutrition/lib/macros";
import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { messages } from "@/i18n/es-419";

export type ComparisonFoodItem = {
  name: string;
  quantityG: number;
  macros: MacroSet;
};

export type ComparisonMeal = {
  id: string;
  label: string;
  mealType?: string;
  items: ComparisonFoodItem[];
  totals: MacroSet;
};

/** Usa los mismos alimentos, cantidades y sustituciones que la vista del día. */
export async function getComparisonMeals(
  userId: string,
  date: string,
  scope: "day" | "plan" = "day",
): Promise<{ dietMeals: ComparisonMeal[]; todayMeals: ComparisonMeal[] }> {
  const [diet, day] = await Promise.all([
    getDietPlanForDate(userId, date, scope),
    getDayPlan(userId, date),
  ]);
  const label = (meal: { name: string | null; mealType: string }) =>
    meal.name ||
    messages.nutrition.mealTypes[
      meal.mealType as keyof typeof messages.nutrition.mealTypes
    ] ||
    meal.mealType;
  return {
    dietMeals: (diet?.meals ?? []).map((meal) => ({
      id: meal.id,
      label: label(meal),
      mealType: meal.mealType,
      totals: meal.totals,
      items: meal.items.map((item) => ({
        name: item.foodName,
        quantityG: item.quantityG,
        macros: item.macros,
      })),
    })),
    todayMeals: day.meals.map((meal) => ({
      id: meal.id,
      label: label(meal),
      mealType: meal.mealType,
      totals: meal.totals,
      items: meal.items.map((item) => ({
        name: item.foodName,
        quantityG: item.quantityG,
        macros: item.macros,
      })),
    })),
  };
}
