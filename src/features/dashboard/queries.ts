import { createClient } from "@/lib/supabase/server";
import {
  movingAverage,
  streakDays,
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
  consumed: MacroTotals;
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
  checkinToday: {
    sleepHours: number | null;
    hunger: number | null;
    energy: number | null;
    stress: number | null;
  } | null;
  adherence: {
    checkins7: number;
    workouts7: number;
    mealDays7: number;
    streak: number;
  };
  recommendation: {
    title: string;
    explanation: string;
    confidence: string;
  } | null;
};

/** Fecha YYYY-MM-DD en la zona horaria del perfil. */
function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function daysAgo(date: string, days: number): string {
  const ms = new Date(`${date}T00:00:00Z`).getTime() - days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, primary_goal, timezone")
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
    checkinsResult,
    planResult,
    lastSessionResult,
    sessions7Result,
    mealDays7Result,
    recommendationResult,
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
      .from("daily_checkins")
      .select("date, sleep_hours, hunger, energy, stress")
      .eq("user_id", userId)
      .gte("date", since60)
      .order("date", { ascending: false }),
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
      .select("id", { count: "exact", head: true })
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
  const checkins = checkinsResult.data ?? [];
  const checkins7 = checkins.filter((row) => row.date >= since7).length;
  const mealDays7 = new Set((mealDays7Result.data ?? []).map((row) => row.date))
    .size;
  const checkinToday = checkins.find((row) => row.date === today) ?? null;

  return {
    displayName: profile?.display_name ?? "",
    timezone,
    today,
    primaryGoal: profile?.primary_goal ?? null,
    targets: targetsResult.data
      ? {
          calories: targetsResult.data.calories,
          proteinG: Number(targetsResult.data.protein_g),
          carbohydrateG: Number(targetsResult.data.carbohydrate_g),
          fatG: Number(targetsResult.data.fat_g),
          fiberG: Number(targetsResult.data.fiber_g),
          waterMl: targetsResult.data.water_ml,
          source: targetsResult.data.source,
        }
      : null,
    consumed,
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
    checkinToday: checkinToday
      ? {
          sleepHours:
            checkinToday.sleep_hours !== null
              ? Number(checkinToday.sleep_hours)
              : null,
          hunger: checkinToday.hunger,
          energy: checkinToday.energy,
          stress: checkinToday.stress,
        }
      : null,
    adherence: {
      checkins7,
      workouts7: sessions7Result.count ?? 0,
      mealDays7,
      streak: streakDays(
        checkins.map((row) => row.date),
        new Date(`${today}T00:00:00Z`),
      ),
    },
    recommendation: recommendationResult.data ?? null,
  };
}
