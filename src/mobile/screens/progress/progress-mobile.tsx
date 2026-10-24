import { getProgressData } from "@/features/progress/queries";
import { getTrainingOverview } from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO, localDateOf } from "@/lib/dates";
import { ScreenHeader } from "@/mobile/shell/screen-header";
import { ProgressSummary } from "./summary";
import { ProgressEvidence } from "./evidence";
import { ProgressSegment } from "./segment";

/**
 * Progreso en telefono: Resumen (peso, grasa, cintura, marca y constancia) y
 * Fotos (con comparador). Mismos datos que escritorio.
 */
export async function ProgressMobile({
  userId,
  vista,
  today,
  timezone,
}: {
  userId: string;
  vista: string | undefined;
  today: string;
  timezone: string;
}) {
  // «Evidencia» es la biblioteca de estudios (/evidencia); las fotos se
  // llaman «Fotos». `vista=evidencia` sigue valiendo para enlaces viejos.
  const fotos = vista === "fotos" || vista === "evidencia";
  const data = await getProgressData(userId);

  let body: React.ReactNode;
  if (fotos) {
    body = (
      <ProgressEvidence photos={data.photos} measurements={data.measurements} />
    );
  } else {
    const supabase = await createClient();
    const desde = addDaysISO(today, -6);
    const [overview, { data: meals }] = await Promise.all([
      getTrainingOverview(userId, { date: today, timezone }),
      supabase
        .from("meals")
        .select("date")
        .eq("user_id", userId)
        .in("status", ["completada", "completada_con_cambios"])
        .is("deleted_at", null)
        .gte("date", desde)
        .lte("date", today),
    ]);
    /* Constancia de 7 dias: dias con comidas registradas y entrenos frente a
       los dias de la rutina activa. Mitad y mitad. */
    const mealDays = new Set((meals ?? []).map((m) => m.date)).size;
    const workouts = overview.recentSessions.filter(
      (s) => s.completedAt && localDateOf(s.startedAt, timezone) >= desde,
    ).length;
    const planDays = overview.activePlan?.days.length ?? 0;
    const constancia =
      planDays > 0
        ? Math.round(
            ((mealDays / 7 + Math.min(1, workouts / planDays)) / 2) * 100,
          )
        : Math.round((mealDays / 7) * 100);

    body = (
      <ProgressSummary
        data={data}
        record={overview.latestRecord}
        constancia={constancia}
        today={today}
      />
    );
  }

  return (
    <div className="m-screen">
      <ScreenHeader
        title="Progreso"
        subtitle={
          fotos
            ? "Tus fotos son privadas: solo tú las ves"
            : "Tu cuerpo y tu constancia"
        }
      />
      <div className="m-body" style={{ paddingBottom: 0 }}>
        <ProgressSegment active={fotos ? "fotos" : "resumen"} />
      </div>
      {body}
    </div>
  );
}
