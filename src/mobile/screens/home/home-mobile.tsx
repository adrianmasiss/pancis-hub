import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { consumedTotals } from "@/features/nutrition/lib/day-overview";
import { getTrainingOverview } from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO, todayInTimezone } from "@/lib/dates";
import { getTrainingAdjustment } from "@/mobile/training-adjustment";
import { streakDays } from "@/mobile/streak";
import { buildWeek } from "@/mobile/screens/training/week";
import { mealLabel } from "@/mobile/screens/nutrition/format";
import { homeInsight } from "./insight";
import { HomeView, type WeightSummary } from "./home-view";

/** La hora local del usuario, no la del servidor. */
function localHour(timezone: string): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: timezone,
      }).format(new Date()),
    );
  } catch {
    return 12;
  }
}

/**
 * Inicio en telefono: solo resume. Cada bloque lleva a su modulo y usa las
 * mismas consultas y acciones que ese modulo, asi que las cifras no pueden
 * discrepar (el agua que se suma aqui es la de Nutricion · Hoy).
 */
export async function HomeMobile({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, primary_goal")
    .eq("id", userId)
    .maybeSingle();
  const timezone = profile?.timezone ?? "America/Costa_Rica";
  const today = todayInTimezone(timezone);
  const [day, diet, overview, ajuste, meals, sessions, weights] =
    await Promise.all([
      getDayPlan(userId, today),
      getDietPlanForDate(userId, today, "day"),
      getTrainingOverview(userId, { date: today, timezone }),
      getTrainingAdjustment(userId, today, timezone),
      supabase
        .from("meals")
        .select("date")
        .eq("user_id", userId)
        .in("status", ["completada", "completada_con_cambios"])
        .is("deleted_at", null)
        .gte("date", addDaysISO(today, -120)),
      supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .gte("started_at", addDaysISO(today, -120)),
      supabase
        .from("body_measurements")
        .select("measured_at, weight_kg")
        .eq("user_id", userId)
        .not("weight_kg", "is", null)
        .order("measured_at", { ascending: false })
        .limit(24),
    ]);

  // El proximo dia de la rutina: el siguiente al de la ultima sesion.
  const days = overview.activePlan?.days ?? [];
  let nextDay = days[0] ?? null;
  const lastDayId = overview.recentSessions[0]?.planDayId;
  if (lastDayId) {
    const i = days.findIndex((d) => d.id === lastDayId);
    if (i >= 0) nextDay = days[(i + 1) % days.length] ?? nextDay;
  }

  const streak = streakDays(
    [
      ...(meals.data ?? []).map((m) => m.date),
      ...(sessions.data ?? []).map((s) => s.started_at.slice(0, 10)),
    ],
    today,
  );

  /* Peso: la ultima medida y su cambio en las 4 semanas previas a ella (la
     medida mas cercana a esa fecha, sin pasarse; sin una, no hay cambio).
     La linea usa las ultimas 12. */
  const serie = [...(weights.data ?? [])].reverse().map((w) => ({
    date: w.measured_at,
    kg: Number(w.weight_kg),
  }));
  const last = serie.at(-1) ?? null;
  const hace4 = last ? addDaysISO(last.date.slice(0, 10), -28) : "";
  const ref = [...serie].reverse().find((w) => w.date <= hace4) ?? null;
  const goal = profile?.primary_goal ?? null;
  const weight: WeightSummary | null = last
    ? {
        kg: last.kg,
        change4w: ref && ref !== last ? last.kg - ref.kg : null,
        direction:
          goal === "perdida_grasa" ? -1 : goal === "ganancia_muscular" ? 1 : 0,
        points: serie.slice(-12).map((w) => w.kg),
      }
    : null;

  const nextMeal = (diet?.meals ?? []).find((m) => !m.loggedToday) ?? null;
  const consumed = consumedTotals(day.meals);
  const insight = homeInsight({
    hour: localHour(timezone),
    extraKcal: ajuste.kcal,
    trainingDayName: ajuste.dayName,
    trainingBasis: ajuste.basis,
    proteinGoalG: day.targets?.proteinG ?? null,
    proteinConsumedG: consumed.proteinG,
    waterTargetMl: day.waterMlTarget,
    waterMl: day.waterMl,
    nextMeal: nextMeal
      ? {
          name: mealLabel(nextMeal.mealType, nextMeal.name),
          time: nextMeal.scheduledTime,
        }
      : null,
  });

  return (
    <HomeView
      extraKcal={ajuste.kcal}
      displayName={displayName}
      today={today}
      day={day}
      diet={diet}
      activePlanId={overview.activePlan?.id ?? null}
      nextDay={nextDay}
      nextDayNumber={nextDay ? days.indexOf(nextDay) + 1 : 0}
      doneToday={Object.values(overview.doneThisWeek).includes(today)}
      sessionInProgress={Boolean(overview.sessionInProgress)}
      week={buildWeek({
        today,
        timezone,
        recentSessions: overview.recentSessions,
        doneThisWeek: overview.doneThisWeek,
      })}
      streak={streak}
      weight={weight}
      insight={insight}
    />
  );
}
