import type { ComparisonMeal } from "../compare-queries";
import { nutritionalDistance } from "@/features/foods/lib/equivalence";
import { normalizeFoodName } from "./food-matching";

/** Similar means the same meal type or at least one shared ingredient. */
export function similarMeal(a: ComparisonMeal, b: ComparisonMeal): boolean {
  if (a.mealType && a.mealType === b.mealType) return true;
  const names = new Set(a.items.map((item) => normalizeFoodName(item.name)));
  return b.items.some((item) => names.has(normalizeFoodName(item.name)));
}
export function rankMealAlternatives(
  reference: ComparisonMeal,
  candidates: ComparisonMeal[],
  mode: "similar" | "macros",
) {
  return candidates
    .filter((meal) => meal.id !== reference.id)
    .filter((meal) => mode === "macros" || similarMeal(reference, meal))
    .sort(
      (a, b) =>
        nutritionalDistance(reference.totals, a.totals) -
        nutritionalDistance(reference.totals, b.totals),
    );
}
