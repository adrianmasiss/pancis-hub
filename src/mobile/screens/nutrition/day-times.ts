import { createClient } from "@/lib/supabase/server";
import type { DietTemplateView } from "@/features/dashboard/queries";

export type MovedMeals = Record<string, string>;

/**
 * Aplica al plan del dia las comidas movidas de hora SOLO ese dia
 * (`diet_meal_day_times`) y reordena por hora. Devuelve tambien que comidas
 * se movieron, con su hora original, para poder restaurarlas.
 */
export async function withDayTimes(
  userId: string,
  date: string,
  diet: DietTemplateView | null,
): Promise<{ diet: DietTemplateView | null; moved: MovedMeals }> {
  if (!diet) return { diet, moved: {} };
  const supabase = await createClient();
  const { data } = await supabase
    .from("diet_meal_day_times")
    .select("template_meal_id, scheduled_time")
    .eq("user_id", userId)
    .eq("date", date);
  if (!data?.length) return { diet, moved: {} };

  const horas = new Map(
    data.map((d) => [d.template_meal_id, d.scheduled_time]),
  );
  const moved: MovedMeals = {};
  const meals = diet.meals
    .map((meal) => {
      const hora = horas.get(meal.id);
      if (!hora) return meal;
      moved[meal.id] = meal.scheduledTime?.slice(0, 5) ?? "";
      return { ...meal, scheduledTime: hora };
    })
    .sort((a, b) =>
      (a.scheduledTime ?? "99").localeCompare(b.scheduledTime ?? "99"),
    );
  return { diet: { ...diet, meals }, moved };
}
