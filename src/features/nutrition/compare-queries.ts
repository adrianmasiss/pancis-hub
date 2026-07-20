import { createClient } from "@/lib/supabase/server";
import {
  scaleMacros,
  sumMacros,
  type MacroSet,
} from "@/features/nutrition/lib/macros";

export type ComparisonFoodItem = {
  name: string;
  quantityG: number;
  macros: MacroSet;
};

export type ComparisonMeal = {
  id: string;
  label: string;
  items: ComparisonFoodItem[];
  totals: MacroSet;
};

function totalsOf(items: ComparisonFoodItem[]): MacroSet {
  return sumMacros(items.map((item) => item.macros));
}

/** Comidas de la dieta activa y comidas registradas hoy, listas para el comparador. */
export async function getComparisonMeals(
  userId: string,
  today: string,
): Promise<{ dietMeals: ComparisonMeal[]; todayMeals: ComparisonMeal[] }> {
  const supabase = await createClient();

  const [dietResult, todayResult] = await Promise.all([
    supabase
      .from("diet_templates")
      .select(
        "diet_template_meals(id, name, meal_type, diet_template_items(quantity_g, foods(name, calories, protein_g, carbohydrate_g, fat_g, fiber_g)))",
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("meals")
      .select(
        "id, name, meal_type, meal_items(calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot, quantity_g, foods(name))",
      )
      .eq("user_id", userId)
      .eq("date", today)
      .is("deleted_at", null),
  ]);

  const dietMeals: ComparisonMeal[] = (
    dietResult.data?.diet_template_meals ?? []
  ).map((meal) => {
    const items: ComparisonFoodItem[] = (meal.diet_template_items ?? []).map(
      (item) => ({
        name: item.foods?.name ?? "",
        quantityG: Number(item.quantity_g),
        macros: scaleMacros(
          {
            calories: Number(item.foods?.calories ?? 0),
            proteinG: Number(item.foods?.protein_g ?? 0),
            carbohydrateG: Number(item.foods?.carbohydrate_g ?? 0),
            fatG: Number(item.foods?.fat_g ?? 0),
            fiberG: Number(item.foods?.fiber_g ?? 0),
          },
          Number(item.quantity_g),
        ),
      }),
    );
    return {
      id: meal.id,
      label: meal.name || meal.meal_type,
      items,
      totals: totalsOf(items),
    };
  });

  const todayMeals: ComparisonMeal[] = (todayResult.data ?? []).map((meal) => {
    const items: ComparisonFoodItem[] = (meal.meal_items ?? []).map((item) => ({
      name: item.foods?.name ?? "",
      quantityG: Number(item.quantity_g),
      macros: {
        calories: Number(item.calories_snapshot),
        proteinG: Number(item.protein_snapshot),
        carbohydrateG: Number(item.carbohydrate_snapshot),
        fatG: Number(item.fat_snapshot),
        fiberG: Number(item.fiber_snapshot),
      },
    }));
    return {
      id: meal.id,
      label: meal.name || meal.meal_type,
      items,
      totals: totalsOf(items),
    };
  });

  return { dietMeals, todayMeals };
}
