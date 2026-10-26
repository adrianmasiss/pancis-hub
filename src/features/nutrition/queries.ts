import { createClient } from "@/lib/supabase/server";
import { sortBySchedule } from "@/features/nutrition/lib/meal-schedule";
import {
  remainingMacros,
  sumMacros,
  type MacroSet,
} from "@/features/nutrition/lib/macros";
import type { MealStatus, MealType } from "@/features/nutrition/schemas";
import { mapDietTemplate } from "@/features/nutrition/lib/diet-plan";
import { consumedTotals } from "@/features/nutrition/lib/day-overview";
import type { DietTemplateView } from "@/features/dashboard/queries";

export type MealItemView = {
  id: string;
  foodId: string | null;
  foodName: string;
  foodBrand: string | null;
  foodGroup?: string | null;
  imageUrl?: string | null;
  cookedState: string | null;
  quantityG: number;
  servingEquivalence: string | null;
  foodPortions: { label: string; grams: number }[];
  macros: MacroSet;
  /** Instantaneas; null = el alimento no traia el dato (no es cero). */
  sodiumMg: number | null;
  sugarG: number | null;
  defaultServingAmount: number;
  defaultServingUnit: string;
};

export type MealView = {
  id: string;
  sourceTemplateMealId?: string | null;
  /** Extra de hoy dentro de esta comida del plan (no la reemplaza). */
  extraOfTemplateMealId?: string | null;
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
  /** Agua bebida en la fecha (suma de water_logs). */
  waterMl: number;
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

  const [mealsResult, targetsResult, waterResult] = await Promise.all([
    supabase
      .from("meals")
      .select(
        "id, source_template_meal_id, extra_of_template_meal_id, meal_type, name, status, notes, created_at, scheduled_time, meal_items(id, food_id, external_name, quantity_g, serving_equivalence, calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot, sodium_snapshot_mg, sugar_snapshot_g, created_at, foods(name, brand, food_group, image_url, cooked_state, serving_amount, serving_unit, food_portions(label, grams)))",
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
    supabase
      .from("water_logs")
      .select("amount_ml")
      .eq("user_id", userId)
      .eq("date", date),
  ]);

  if (mealsResult.error || targetsResult.error)
    throw new Error("No se pudo cargar el registro de nutrición.");

  const meals: MealView[] = (mealsResult.data ?? [])
    .map((meal) => {
      const items: MealItemView[] = [...(meal.meal_items ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((item) => ({
          id: item.id,
          foodId: item.food_id,
          foodName: item.foods?.name ?? item.external_name ?? "",
          foodBrand: item.foods?.brand ?? null,
          foodGroup: item.foods?.food_group ?? null,
          imageUrl: item.foods?.image_url ?? null,
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
          sodiumMg:
            item.sodium_snapshot_mg === null
              ? null
              : Number(item.sodium_snapshot_mg),
          sugarG:
            item.sugar_snapshot_g === null
              ? null
              : Number(item.sugar_snapshot_g),
          defaultServingAmount: Number(item.foods?.serving_amount ?? 100),
          defaultServingUnit: item.foods?.serving_unit ?? "g",
        }));
      return {
        id: meal.id,
        sourceTemplateMealId: meal.source_template_meal_id,
        extraOfTemplateMealId: meal.extra_of_template_meal_id,
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

  const consumed = consumedTotals(meals);

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
    // Si la tabla de agua fallara, el dia no deja de cargar: el agua sale en
    // cero y el resto de la pantalla sigue siendo verdad.
    waterMl: (waterResult.data ?? []).reduce(
      (total, row) => total + Number(row.amount_ml),
      0,
    ),
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
  scope: "day" | "plan" = "day",
): Promise<DietTemplateView | null> {
  const supabase = await createClient();

  const [templateResult, daySwapsResult, loggedMealsResult] = await Promise.all(
    [
      supabase
        .from("diet_templates")
        .select(
          "id, name, target_calories, target_protein, target_carbs, target_fat, diet_template_meals(id, name, meal_type, order_index, scheduled_time, diet_template_items(id, quantity_g, serving_equivalence, foods(id, name, owner_user_id, food_group, image_url, sodium_mg, sugar_g, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams))))",
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
      // Solo las de ESTA fecha: el plan guardado no se toca nunca.
      supabase
        .from("diet_item_day_swaps")
        .select(
          "template_item_id, quantity_g, source, omitted, external_name, external_calories, external_protein_g, external_carbohydrate_g, external_fat_g, foods(id, name, owner_user_id, food_group, image_url, sodium_mg, sugar_g, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams))",
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

  if (templateResult.error || daySwapsResult.error || loggedMealsResult.error)
    throw new Error("No se pudo cargar el plan de alimentación.");

  return mapDietTemplate({
    template: templateResult.data,
    daySwaps: scope === "day" ? (daySwapsResult.data ?? []) : [],
    loggedTemplateMealIds: new Set(
      (loggedMealsResult.data ?? [])
        .map((row) => row.source_template_meal_id)
        .filter((id): id is string => Boolean(id)),
    ),
  });
}
