import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ViewHeader } from "@/components/shared/view-header";
import { SessionView } from "@/features/training/components/session-view";
import {
  getSessionDetail,
  getTrainingOverview,
} from "@/features/training/queries";
import { isPhone } from "@/lib/device";
import { todayInTimezone } from "@/lib/dates";
import { ActiveWorkout } from "@/mobile/screens/training/active-workout";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export const metadata: Metadata = { title: t.sessionTitle };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const session = await getSessionDetail(user.id, id);
  if (!session) notFound();
  if (session.completedAt) redirect("/entrenamiento");

  // Telefono: la misma pantalla completa que la sesion de un dia del plan.
  if (await isPhone()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle();
    const timezone = profile?.timezone ?? "America/Costa_Rica";
    const today = todayInTimezone(timezone);
    const overview = await getTrainingOverview(user.id, {
      date: today,
      timezone,
    });
    return (
      <ActiveWorkout
        session={session}
        history={overview.history}
        images={{}}
        backHref="/entrenamiento?vista=hoy"
        today={today}
        timezone={timezone}
        recentSessions={overview.recentSessions}
        doneThisWeek={overview.doneThisWeek}
      />
    );
  }

  const title = session.planName
    ? `${session.planName}${session.dayName ? ` — ${session.dayName}` : ""}`
    : t.freeSession;

  return (
    <>
      <ViewHeader title={title} description={t.sessionTitle} />
      <SessionView session={session} />
    </>
  );
}
