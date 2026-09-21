import { createClient } from "@/lib/supabase/server";
import { sortBySchedule } from "@/features/nutrition/lib/meal-schedule";
import {
  remainingMacros,
  sumMacros,
  type MacroSet,
} from "@/features/nutrition/lib/macros";
import type { MealStatus, MealType } from "@/features/nutrition/schemas";
import { mapDietTemplate } from "@/features/nutrition/lib/diet-plan";
import type { DietTemplateView } from "@/features/dashboard/queries";

export type MealItemView = {
  id: string;
  foodId: string | null;
  foodName: string;
  foodBrand: string | null;
  cookedState: string | null;
  quantityG: number;
  servingEquivalence: string | null;
  foodPortions: { label: string; grams: number }[];
  macros: MacroSet;
  defaultServingAmount: number;
  defaultServingUnit: string;
};

export type MealView = {
  id: string;
  mealType: MealType;
  name: string | null;
  status: MealStatus;
  notes: string | null;
  /** Hora planificada (HH:MM:SS) o null si no se definio. */
  scheduledTime: string | null;
  createdAt: string;
  items: MealItemView[];
  totals: MacroSet;
};

export type DayPlan = {
  date: string;
  meals: MealView[];
  totals: MacroSet;
  targets: MacroSet | null;
  waterMlTarget: number | null;
  remaining: MacroSet | null;
};

const MEAL_ORDER: Record<string, number> = {
  desayuno: 0,
  almuerzo: 1,
  cena: 2,
  snack: 3,
  otro: 4,
};

export async function getDayPlan(
  userId: string,
  date: string,
): Promise<DayPlan> {
  const supabase = await createClient();

  const [mealsResult, targetsResult] = await Promise.all([
    supabase
      .from("meals")
      .select(
        "id, meal_type, name, status, notes, created_at, scheduled_time, meal_items(id, food_id, external_name, quantity_g, serving_equivalence, calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot, created_at, foods(name, brand, cooked_state, serving_amount, serving_unit, food_portions(label, grams)))",
      )
      .eq("user_id", userId)
      .eq("date", date)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("nutrition_targets")
      .select("calories, protein_g, carbohydrate_g, fat_g, fiber_g, water_ml")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const meals: MealView[] = (mealsResult.data ?? [])
    .map((meal) => {
      const items: MealItemView[] = [...(meal.meal_items ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((item) => ({
          id: item.id,
          foodId: item.food_id,
          foodName: item.foods?.name ?? item.external_name ?? "",
          foodBrand: item.foods?.brand ?? null,
          cookedState: item.foods?.cooked_state ?? null,
          quantityG: Number(item.quantity_g),
          servingEquivalence: item.serving_equivalence ?? null,
          foodPortions: (item.foods?.food_portions ?? []).map(
            (p: { label: string; grams: number }) => ({
              label: p.label,
              grams: Number(p.grams),
            }),
          ),
          macros: {
            calories: Number(item.calories_snapshot),
            proteinG: Number(item.protein_snapshot),
            carbohydrateG: Number(item.carbohydrate_snapshot),
            fatG: Number(item.fat_snapshot),
            fiberG: Number(item.fiber_snapshot),
          },
          defaultServingAmount: Number(item.foods?.serving_amount ?? 100),
          defaultServingUnit: item.foods?.serving_unit ?? "g",
        }));
      return {
        id: meal.id,
        mealType: meal.meal_type as MealType,
        name: meal.name,
        status: meal.status as MealStatus,
        notes: meal.notes,
        scheduledTime: meal.scheduled_time,
        createdAt: meal.created_at,
        items,
        totals: sumMacros(items.map((item) => item.macros)),
      };
    })
    // El horario manda sobre el tipo de comida: con dos o tres snacks al
    // dia, la etiqueta ya no distingue cual va antes. Las comidas sin hora
    // conservan el orden por tipo.
    .sort((a, b) => {
      const byTime = sortBySchedule([a, b]);
      if (a.scheduledTime || b.scheduledTime) {
        return byTime[0] === a ? -1 : 1;
      }
      return (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9);
    });

  const consumed = sumMacros(
    meals
      .filter((meal) => meal.status !== "omitida")
      .map((meal) => meal.totals),
  );

  const targets: MacroSet | null = targetsResult.data
    ? {
        calories: targetsResult.data.calories,
        proteinG: Number(targetsResult.data.protein_g),
        carbohydrateG: Number(targetsResult.data.carbohydrate_g),
        fatG: Number(targetsResult.data.fat_g),
        fiberG: Number(targetsResult.data.fiber_g),
      }
    : null;

  return {
    date,
    meals,
    totals: consumed,
    targets,
    waterMlTarget: targetsResult.data?.water_ml ?? null,
    remaining: targets ? remainingMacros(targets, consumed) : null,
  };
}

/**
 * El plan de dieta para una fecha, con las sustituciones de ese dia y el
 * estado de "ya la comi" por comida.
 *
 * Es lo que Nutricion muestra desde que la pantalla sigue la maqueta: el plan
 * del dia, no el registro. Reutiliza el mismo mapeo que el panel de Hoy
 * (`nutrition/lib/diet-plan`), asi que las dos pantallas no pueden discrepar
 * en una cifra.
 */
export async function getDietPlanForDate(
  userId: string,
  date: string,
): Promise<DietTemplateView | null> {
  const supabase = await createClient();

  const [templateResult, daySwapsResult, loggedMealsResult] = await Promise.all(
    [
      supabase
        .from("diet_templates")
        .select(
          "id, name, target_calories, target_protein, target_carbs, target_fat, diet_template_meals(id, name, meal_type, order_index, diet_template_items(id, quantity_g, serving_equivalence, foods(id, name, owner_user_id, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams))))",
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
      // Solo las de ESTA fecha: el plan guardado no se toca nunca.
      supabase
        .from("diet_item_day_swaps")
        .select(
          "template_item_id, quantity_g, source, external_name, external_calories, external_protein_g, external_carbohydrate_g, external_fat_g, foods(id, name, owner_user_id, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams))",
        )
        .eq("user_id", userId)
        .eq("date", date),
      supabase
        .from("meals")
        .select("source_template_meal_id")
        .eq("user_id", userId)
        .eq("date", date)
        .is("deleted_at", null),
    ],
  );

  return mapDietTemplate({
    template: templateResult.data,
    daySwaps: daySwapsResult.data ?? [],
    loggedTemplateMealIds: new Set(
      (loggedMealsResult.data ?? [])
        .map((row) => row.source_template_meal_id)
        .filter((id): id is string => Boolean(id)),
    ),
  });
}
