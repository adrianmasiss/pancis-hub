import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
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
      <PageHeader
        icon={Dumbbell}
        title={t.title}
        description="Organiza tus rutinas y registra tus series y descansos."
        actions={
          <>
            {overview.sessionInProgress ? (
              <Button asChild size="sm" variant="outline">
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
              />
            ) : (
              <StartSessionButton label={t.freeSession} variant="outline" />
            )}
            <ImportRoutineDialog />
            <CreatePlanDialog />
          </>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t.plansSection}</h2>
        {overview.plans.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
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
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.historySection}</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recentSessions.length > 0 ? (
              <ul className="divide-y">
                {overview.recentSessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex items-baseline gap-2 py-2 text-sm"
                  >
                    <span className="text-muted-foreground w-14 text-xs">
                      {formatDate(session.startedAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {session.planName ?? t.freeSession}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.prsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.records.length > 0 ? (
                <ul className="space-y-1.5">
                  {overview.records.map((record) => (
                    <li
                      key={record.exerciseId}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {record.exerciseName}
                      </span>
                      <span className="font-medium tabular-nums">
                        {record.weightKg} {t.kgUnit} × {record.repetitions}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">{t.noHistory}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t.muscleFrequencyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.muscleSets7d.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {overview.muscleSets7d.map(([muscle, count]) => (
                    <Badge
                      key={muscle}
                      variant="secondary"
                      className="font-normal"
                    >
                      {muscle}: {count}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t.noHistory}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
