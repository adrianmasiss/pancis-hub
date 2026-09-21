import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import {
  mapDietTemplate,
  plannedTotalsOf,
} from "@/features/nutrition/lib/diet-plan";
import {
  DEFAULT_TOLERANCES,
  type MacroTolerances,
} from "@/features/nutrition/lib/tolerances";
import {
  movingAverage,
  trendDirection,
  windowDifference,
  type DatedValue,
  type TrendDirection,
} from "@/lib/trends";

export type MacroTotals = {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

export type DietTemplateItemView = {
  id: string;
  foodId: string;
  foodName: string;
  isCustom: boolean;
  quantityG: number;
  servingEquivalence: string | null;
  foodPortions: { label: string; grams: number }[];
  macros: MacroTotals;
  /**
   * Sustitucion vigente solo para el dia consultado. Cuando existe, los campos
   * de arriba ya describen al sustituto: la vista no tiene que recalcular
   * nada. Se conserva el nombre original para poder ofrecer deshacer.
   */
  daySwap: {
    originalFoodName: string;
    source: "biblioteca" | "asistente";
  } | null;
};

export type DietTemplateMealView = {
  id: string;
  name: string | null;
  mealType: string;
  orderIndex: number;
  /**
   * Hora del plan para esta comida, `HH:MM:SS` o nula.
   *
   * La columna existia en la tabla desde el principio y nadie la leia: la
   * interfaz resolvia la hora con un mapa fijo por `meal_type`, y como la
   * tabla solo admite cinco tipos, "Media manana" y "Merienda" comparten
   * `snack` y salian las dos a la misma hora.
   */
  scheduledTime: string | null;
  items: DietTemplateItemView[];
  totals: MacroTotals;
  /** true si esta comida concreta del plan ya se registro para la fecha. */
  loggedToday: boolean;
};

export type DietTemplateView = {
  id: string;
  name: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: DietTemplateMealView[];
};

export type DashboardData = {
  displayName: string;
  timezone: string;
  today: string;
  primaryGoal: string | null;
  targets: {
    calories: number;
    proteinG: number;
    carbohydrateG: number;
    fatG: number;
    fiberG: number;
    waterMl: number;
    source: string;
  } | null;
  dietTemplate: DietTemplateView | null;
  consumed: MacroTotals;
  /**
   * Suma del plan del dia, con las sustituciones de hoy ya aplicadas. null
   * cuando no hay dieta activa: no es cero, es que no se sabe.
   */
  plannedTotals: MacroTotals | null;
  /** Tolerancias del usuario. Son preferencias suyas, no limites clinicos. */
  tolerances: MacroTolerances;
  mealsLoggedToday: number;
  training: {
    activePlanName: string | null;
    nextDayName: string | null;
    mainExercises: string[];
    estimatedMinutes: number | null;
    lastSession: { date: string; setsCount: number } | null;
  };
  weight: {
    series: DatedValue[];
    average7Series: DatedValue[];
    last: { date: string; value: number } | null;
    average7: number | null;
    weeklyChange: number | null;
    trend: TrendDirection | null;
    lastMeasurementDate: string | null;
  };
  adherence: {
    workouts7: number;
    mealDays7: number;
    /** Los 7 dias, del mas antiguo al de hoy, con lo que ocurrio en cada uno. */
    days: { date: string; trained: boolean; ate: boolean }[];
  };
  recommendation: {
    title: string;
    explanation: string;
    confidence: string;
  } | null;
};

function daysAgo(date: string, days: number): string {
  const ms = new Date(`${date}T00:00:00Z`).getTime() - days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, primary_goal, timezone, tolerance_calories_pct, tolerance_protein_pct, tolerance_carbs_pct, tolerance_fat_pct",
    )
    .eq("id", userId)
    .single();

  const timezone = profile?.timezone ?? "UTC";
  const today = todayInTimezone(timezone);
  const since60 = daysAgo(today, 60);
  const since7 = daysAgo(today, 6);

  const [
    targetsResult,
    mealsResult,
    measurementsResult,
    planResult,
    lastSessionResult,
    sessions7Result,
    mealDays7Result,
    recommendationResult,
    dietTemplateResult,
    todayPlanMealsResult,
    daySwapsResult,
  ] = await Promise.all([
    supabase
      .from("nutrition_targets")
      .select(
        "calories, protein_g, carbohydrate_g, fat_g, fiber_g, water_ml, source",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("meals")
      .select(
        "id, status, meal_items(calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot)",
      )
      .eq("user_id", userId)
      .eq("date", today)
      .is("deleted_at", null),
    supabase
      .from("body_measurements")
      .select("measured_at, weight_kg")
      .eq("user_id", userId)
      .gte("measured_at", since60)
      .order("measured_at", { ascending: true }),
    supabase
      .from("workout_plans")
      .select(
        "id, name, workout_plan_days(id, day_index, name, workout_plan_exercises(position, sets, rest_seconds, exercise_catalog(name)))",
      )
      .eq("user_id", userId)
      .eq("active", true)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("started_at, workout_plan_day_id, workout_sets(id)")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      // Se traen las fechas en vez de solo el conteo: la tarjeta de adherencia
      // dibuja los 7 dias uno a uno. Son 7 filas como maximo.
      .select("started_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("started_at", `${since7}T00:00:00Z`),
    supabase
      .from("meals")
      .select("date")
      .eq("user_id", userId)
      .gte("date", since7)
      .is("deleted_at", null),
    supabase
      .from("recommendations")
      .select("title, explanation, confidence")
      .eq("user_id", userId)
      .in("status", ["nueva", "vista"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("diet_templates")
      .select(
        "id, name, target_calories, target_protein, target_carbs, target_fat, diet_template_meals(id, name, meal_type, order_index, scheduled_time, diet_template_items(id, quantity_g, serving_equivalence, foods(id, name, owner_user_id, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams))))",
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("source_template_meal_id")
      .eq("user_id", userId)
      .eq("date", today)
      .is("deleted_at", null),
    // Sustituciones vigentes solo para hoy. El plan no se toca: se superponen
    // al mapearlo, de modo que manana reaparece el alimento original.
    supabase
      .from("diet_item_day_swaps")
      .select(
        "template_item_id, quantity_g, source, external_name, external_calories, external_protein_g, external_carbohydrate_g, external_fat_g, foods(id, name, owner_user_id, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams))",
      )
      .eq("user_id", userId)
      .eq("date", today),
  ]);

  // Nutricion: suma de snapshots de las comidas del dia (omitidas excluidas).
  const consumed: MacroTotals = {
    calories: 0,
    proteinG: 0,
    carbohydrateG: 0,
    fatG: 0,
    fiberG: 0,
  };
  let mealsLoggedToday = 0;
  for (const meal of mealsResult.data ?? []) {
    if (meal.status === "omitida") continue;
    if ((meal.meal_items ?? []).length > 0) mealsLoggedToday += 1;
    for (const item of meal.meal_items ?? []) {
      consumed.calories += item.calories_snapshot ?? 0;
      consumed.proteinG += item.protein_snapshot ?? 0;
      consumed.carbohydrateG += item.carbohydrate_snapshot ?? 0;
      consumed.fatG += item.fat_snapshot ?? 0;
      consumed.fiberG += item.fiber_snapshot ?? 0;
    }
  }
  consumed.calories = Math.round(consumed.calories);
  consumed.proteinG = round1(consumed.proteinG);
  consumed.carbohydrateG = round1(consumed.carbohydrateG);
  consumed.fatG = round1(consumed.fatG);
  consumed.fiberG = round1(consumed.fiberG);

  // Peso: serie, promedio movil y tendencia prudente.
  const series: DatedValue[] = (measurementsResult.data ?? [])
    .filter((row) => row.weight_kg !== null)
    .map((row) => ({ date: row.measured_at, value: Number(row.weight_kg) }));
  const average7Series = movingAverage(series, 7);
  const last = series.length > 0 ? series[series.length - 1]! : null;
  const weeklyChange = windowDifference(
    series,
    7,
    new Date(`${today}T00:00:00Z`),
  );
  const lastMeasurementDate =
    (measurementsResult.data ?? []).length > 0
      ? (measurementsResult.data ?? [])[
          (measurementsResult.data ?? []).length - 1
        ]!.measured_at
      : null;

  // Entrenamiento: proximo dia del plan activo (rotacion simple tras la ultima sesion).
  const plan = planResult.data;
  const planDays = [...(plan?.workout_plan_days ?? [])].sort(
    (a, b) => a.day_index - b.day_index,
  );
  let nextDay = planDays[0] ?? null;
  if (plan && lastSessionResult.data?.workout_plan_day_id) {
    const lastIndex = planDays.findIndex(
      (day) => day.id === lastSessionResult.data?.workout_plan_day_id,
    );
    if (lastIndex >= 0) {
      nextDay = planDays[(lastIndex + 1) % planDays.length] ?? nextDay;
    }
  }
  const nextExercises = [...(nextDay?.workout_plan_exercises ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  // Estimacion simple: por serie, ~40 s de trabajo + descanso configurado.
  const estimatedMinutes =
    nextExercises.length > 0
      ? Math.round(
          nextExercises.reduce(
            (total, exercise) =>
              total +
              (exercise.sets ?? 3) * (40 + (exercise.rest_seconds ?? 90)),
            0,
          ) / 60,
        )
      : null;

  // Adherencia sobre los ultimos 7 dias.
  const mealDaySet = new Set(
    (mealDays7Result.data ?? []).map((row) => row.date),
  );
  const mealDays7 = mealDaySet.size;

  // Las sesiones vienen con marca UTC; se compara por dia calendario.
  const workoutDaySet = new Set(
    (sessions7Result.data ?? []).map((row) =>
      String(row.started_at).slice(0, 10),
    ),
  );
  const adherenceDays = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgo(today, 6 - index);
    return {
      date,
      trained: workoutDaySet.has(date),
      ate: mealDaySet.has(date),
    };
  });

  // El objetivo diario siempre viene de nutrition_targets (versionado,
  // editable desde el onboarding/configuracion). La dieta importada con IA
  // es un plan de comidas complementario, no reemplaza el objetivo.
  const targets = targetsResult.data
    ? {
        calories: targetsResult.data.calories,
        proteinG: Number(targetsResult.data.protein_g),
        carbohydrateG: Number(targetsResult.data.carbohydrate_g),
        fatG: Number(targetsResult.data.fat_g),
        fiberG: Number(targetsResult.data.fiber_g),
        waterMl: targetsResult.data.water_ml,
        source: targetsResult.data.source,
      }
    : null;

  const loggedTemplateMealIds = new Set(
    (todayPlanMealsResult.data ?? [])
      .map((row) => row.source_template_meal_id)
      .filter((id): id is string => Boolean(id)),
  );

  // El mapeo del plan (sustituciones del dia superpuestas, macros por item y
  // totales) vive en `nutrition/lib/diet-plan`: Nutricion necesita lo mismo
  // para una fecha cualquiera, y dos copias de esta aritmetica se separan.
  const dietTemplate = mapDietTemplate({
    template: dietTemplateResult.data,
    daySwaps: daySwapsResult.data ?? [],
    loggedTemplateMealIds,
  });

  const plannedTotals = plannedTotalsOf(dietTemplate);

  return {
    displayName: profile?.display_name ?? "",
    timezone,
    today,
    primaryGoal: profile?.primary_goal ?? null,
    targets,
    dietTemplate,
    consumed,
    plannedTotals,
    tolerances: {
      caloriesPct: Number(
        profile?.tolerance_calories_pct ?? DEFAULT_TOLERANCES.caloriesPct,
      ),
      proteinPct: Number(
        profile?.tolerance_protein_pct ?? DEFAULT_TOLERANCES.proteinPct,
      ),
      carbsPct: Number(
        profile?.tolerance_carbs_pct ?? DEFAULT_TOLERANCES.carbsPct,
      ),
      fatPct: Number(profile?.tolerance_fat_pct ?? DEFAULT_TOLERANCES.fatPct),
    },
    mealsLoggedToday,
    training: {
      activePlanName: plan?.name ?? null,
      nextDayName: nextDay?.name ?? null,
      mainExercises: nextExercises
        .slice(0, 3)
        .map((exercise) => exercise.exercise_catalog?.name ?? "")
        .filter(Boolean),
      estimatedMinutes,
      lastSession: lastSessionResult.data
        ? {
            date: lastSessionResult.data.started_at.slice(0, 10),
            setsCount: (lastSessionResult.data.workout_sets ?? []).length,
          }
        : null,
    },
    weight: {
      series,
      average7Series,
      last,
      average7:
        average7Series.length > 0
          ? average7Series[average7Series.length - 1]!.value
          : null,
      weeklyChange,
      trend: trendDirection(weeklyChange),
      lastMeasurementDate,
    },
    adherence: {
      // Sesiones, no dias: dos entrenos en un mismo dia cuentan dos veces,
      // igual que antes de traer las fechas.
      workouts7: sessions7Result.data?.length ?? 0,
      mealDays7,
      days: adherenceDays,
    },
    recommendation: recommendationResult.data ?? null,
  };
}
