import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { getTrainingOverview } from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { getTrainingAdjustment } from "@/mobile/training-adjustment";
import { HomeView } from "./home-view";

/** El saludo por la hora del usuario, no la del servidor. */
function saludo(timezone: string): string {
  let h = 12;
  try {
    h = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      }).format(new Date()),
    );
  } catch {}
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/**
 * Hoy en telefono (no venia en el diseño; el usuario pidio conservarlo): lo
 * que queda de comer y la comida que toca, el entreno del dia y el copiloto.
 * Las mismas consultas que Nutricion y Entrenar, asi que las cifras no
 * pueden discrepar.
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
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const timezone = profile?.timezone ?? "America/Costa_Rica";
  const today = todayInTimezone(timezone);
  const [day, diet, overview, ajuste] = await Promise.all([
    getDayPlan(userId, today),
    getDietPlanForDate(userId, today, "day"),
    getTrainingOverview(userId, { date: today, timezone }),
    getTrainingAdjustment(userId, today, timezone),
  ]);

  // El proximo dia de la rutina: el siguiente al de la ultima sesion.
  const days = overview.activePlan?.days ?? [];
  let nextDay = days[0] ?? null;
  const lastDayId = overview.recentSessions[0]?.planDayId;
  if (lastDayId) {
    const i = days.findIndex((d) => d.id === lastDayId);
    if (i >= 0) nextDay = days[(i + 1) % days.length] ?? nextDay;
  }

  return (
    <HomeView
      greeting={saludo(timezone)}
      extraKcal={ajuste.kcal}
      displayName={displayName}
      today={today}
      day={day}
      diet={diet}
      planName={overview.activePlan?.name ?? null}
      nextDay={nextDay}
      nextDayNumber={nextDay ? days.indexOf(nextDay) + 1 : 0}
      doneToday={Object.values(overview.doneThisWeek).includes(today)}
      sessionInProgress={Boolean(overview.sessionInProgress)}
    />
  );
}
