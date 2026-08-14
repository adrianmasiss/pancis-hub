import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { CreatePlanDialog } from "@/features/training/components/create-plan-dialog";
import { ImportRoutineDialog } from "@/features/training/components/import-routine-dialog";
import { PlanCard } from "@/features/training/components/plan-card";
import { StartSessionButton } from "@/features/training/components/start-session-button";
import { getTrainingOverview } from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export const metadata: Metadata = { title: t.title };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const overview = await getTrainingOverview(user.id);

  // Proximo dia del plan activo: el siguiente al de la ultima sesion.
  const activeDays = overview.activePlan?.days ?? [];
  let nextDay = activeDays[0] ?? null;
  const lastDayId = overview.recentSessions[0]?.planDayId;
  if (lastDayId) {
    const lastIndex = activeDays.findIndex((day) => day.id === lastDayId);
    if (lastIndex >= 0) {
      nextDay = activeDays[(lastIndex + 1) % activeDays.length] ?? nextDay;
    }
  }

  return (
    <>
      {/*
        UNA accion prominente (regla 1): entrenar. La cabecera tenia tres
        botones del mismo tamano y dos de ellos en naranja solido —empezar,
        importar y crear—, asi que ninguno mandaba y el gesto del dia se leia
        igual que una tarea de mantenimiento. Crear e importar rutina no
        desaparecen ni dejan de ser naranjas: bajan a la seccion de Rutinas,
        que es de lo que tratan.
      */}
      <PageHeader
        title={t.title}
        actions={
          overview.sessionInProgress ? (
            <Button asChild variant="brand" size="lg">
              <Link
                href={`/entrenamiento/sesion/${overview.sessionInProgress.id}`}
              >
                {t.continueSession}
              </Link>
            </Button>
          ) : overview.activePlan && nextDay ? (
            <StartSessionButton
              planId={overview.activePlan.id}
              planDayId={nextDay.id}
              variant="brand"
            />
          ) : (
            <StartSessionButton label={t.freeSession} variant="brand" />
          )
        }
      />

      <Section
        variant="plain"
        title={t.plansSection}
        action={
          <span className="flex flex-wrap items-center gap-2">
            <ImportRoutineDialog />
            <CreatePlanDialog />
          </span>
        }
      >
        {overview.plans.length > 0 ? (
          /* Lista, no rejilla: las rutinas son una secuencia, y la de dos
             columnas dejaba la activa compitiendo con una vecina. */
          <div className="flex flex-col gap-4">
            {overview.plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t.noPlans}
            description={t.noPlansDescription}
            icon={Dumbbell}
          />
        )}
      </Section>

      {/*
        Una sola columna, tambien en escritorio: las tres secciones iban en una
        rejilla de dos columnas que dejaba "Historial" alto y solo a la
        izquierda. El sistema pide columna centrada, no repartir por rellenar
        el ancho.
      */}
      <Section title={t.historySection}>
        {overview.recentSessions.length > 0 ? (
          <ul className="border-rule border-t">
            {overview.recentSessions.map((session) => (
              <li
                key={session.id}
                className="border-rule flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b py-3 text-sm"
              >
                <span className="text-muted-foreground num w-12 shrink-0 text-xs">
                  {formatDate(session.startedAt)}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {session.planName ?? t.freeSession}
                </span>
                <span className="text-muted-foreground num shrink-0 text-xs">
                  {session.setsCount} {t.setsLabel} · {session.volume}{" "}
                  {t.kgUnit}
                  {session.durationMinutes
                    ? ` · ${session.durationMinutes} ${t.minutesShort}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t.noHistory}</p>
        )}
      </Section>

      <Section title={t.prsTitle}>
        {overview.records.length > 0 ? (
          <ul className="border-rule border-t">
            {overview.records.map((record) => (
              <li
                key={record.exerciseId}
                className="border-rule flex items-baseline justify-between gap-3 border-b py-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {record.exerciseName}
                </span>
                <span className="num-strong shrink-0">
                  {record.weightKg} {t.kgUnit} × {record.repetitions}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t.noHistory}</p>
        )}
      </Section>

      <Section title={t.muscleFrequencyTitle}>
        {overview.muscleSets7d.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {overview.muscleSets7d.map(([muscle, count]) => (
              <Badge key={muscle} variant="secondary" className="font-normal">
                {muscle}: {count}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t.noHistory}</p>
        )}
      </Section>
    </>
  );
}
