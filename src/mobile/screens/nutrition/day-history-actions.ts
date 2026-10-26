"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { getTrainingAdjustment } from "@/mobile/training-adjustment";
import { withDayTimes } from "./day-times";
import { mealLabel } from "./format";

/** Como quedo cada alimento del dia frente al plan. */
export type FoodOutcome = "plan" | "sustituido" | "receta" | "extra" | "no";

export type DayHistoryMeal = {
  key: string;
  name: string;
  time: string | null;
  /** Del plan, o agregada ese dia. */
  fromPlan: boolean;
  foods: {
    id: string;
    name: string;
    grams: number;
    kcal: number;
    outcome: FoodOutcome;
    /** Con `sustituido`: lo que decia el plan. */
    original?: string;
  }[];
};

export type DayHistory = {
  date: string;
  consumed: MacroSet;
  targets: MacroSet | null;
  /** Kcal que el entreno sumo a la meta ese dia (0 si no hubo). */
  adjustmentKcal: number;
  adjustmentDay: string | null;
  meals: DayHistoryMeal[];
};

/**
 * El resumen de un dia del historial: lo comido frente a la meta y, comida
 * por comida, que fue segun el plan, que se sustituyo, que se agrego y que
 * no se comio. Lee lo mismo que la vista de Hoy, para esa fecha.
 */
export async function getDayHistory(
  input: unknown,
): Promise<{ error: string } | DayHistory> {
  const parsed = z
    .object({ date: z.iso.date(), timezone: z.string().max(64) })
    .safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: "No se pudo cargar el día." };
  const { date, timezone } = parsed.data;

  const [day, plan, ajuste] = await Promise.all([
    getDayPlan(user.id, date),
    getDietPlanForDate(user.id, date, "day"),
    getTrainingAdjustment(user.id, date, timezone).catch(() => null),
  ]);
  // Con las comidas movidas de hora ese dia.
  const { diet } = await withDayTimes(user.id, date, plan);

  const meals: DayHistoryMeal[] = [];
  for (const tm of diet?.meals ?? []) {
    const logged = day.meals.find((m) => m.sourceTemplateMealId === tm.id);
    const extras = day.meals.filter((m) => m.extraOfTemplateMealId === tm.id);
    const foods: DayHistoryMeal["foods"] =
      logged?.status === "completada_con_cambios"
        ? logged.items.map((i) => ({
            id: i.id,
            name: i.foodName,
            grams: i.quantityG,
            kcal: i.macros.calories,
            outcome: "receta" as const,
          }))
        : tm.items.map((i) => ({
            id: i.id,
            name: i.foodName,
            grams: i.quantityG,
            kcal: i.macros.calories,
            outcome:
              !logged || i.omitted
                ? ("no" as const)
                : i.daySwap && i.daySwap.originalFoodName !== i.foodName
                  ? ("sustituido" as const)
                  : ("plan" as const),
            original: i.daySwap?.originalFoodName,
          }));
    for (const e of extras)
      for (const i of e.items)
        foods.push({
          id: i.id,
          name: i.foodName,
          grams: i.quantityG,
          kcal: i.macros.calories,
          outcome: "extra",
        });
    meals.push({
      key: tm.id,
      name: mealLabel(tm.mealType, tm.name),
      time: tm.scheduledTime?.slice(0, 5) ?? null,
      fromPlan: true,
      foods,
    });
  }
  for (const m of day.meals) {
    if (m.sourceTemplateMealId || m.extraOfTemplateMealId) continue;
    meals.push({
      key: m.id,
      name: mealLabel(m.mealType, m.name),
      time: m.scheduledTime?.slice(0, 5) ?? null,
      fromPlan: false,
      foods: m.items.map((i) => ({
        id: i.id,
        name: i.foodName,
        grams: i.quantityG,
        kcal: i.macros.calories,
        outcome: "extra" as const,
      })),
    });
  }
  meals.sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));

  // En dias pasados solo cuenta un entreno hecho; el «previsto» es de hoy.
  const vale = ajuste && ajuste.kcal > 0 && ajuste.basis === "hecho";
  return {
    date,
    consumed: day.totals,
    targets: day.targets,
    adjustmentKcal: vale ? ajuste.kcal : 0,
    adjustmentDay: vale ? ajuste.dayName : null,
    meals,
  };
}
