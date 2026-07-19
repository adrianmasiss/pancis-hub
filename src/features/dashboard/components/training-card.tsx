import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.training;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function TrainingCard({ data }: { data: DashboardData }) {
  const { training } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {training.activePlanName ? (
          <>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                {t.scheduled}
              </p>
              <p className="font-medium">
                {training.activePlanName}
                {training.nextDayName ? ` — ${training.nextDayName}` : ""}
              </p>
              {training.estimatedMinutes ? (
                <p className="text-muted-foreground text-xs">
                  {t.estimatedDuration}: ~{training.estimatedMinutes}{" "}
                  {t.minutes}
                </p>
              ) : null}
            </div>
            {training.mainExercises.length > 0 ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">
                  {t.mainExercises}
                </p>
                <ul className="space-y-0.5 text-sm">
                  {training.mainExercises.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <Button asChild size="sm">
                <Link href="/entrenamiento">{t.start}</Link>
              </Button>
              {training.lastSession ? (
                <p className="text-muted-foreground text-xs">
                  {t.lastSession}: {formatDate(training.lastSession.date)} ·{" "}
                  {training.lastSession.setsCount} {t.setsLogged}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <EmptyState
            title={t.noPlan}
            description={messages.emptyStates.training.description}
            icon={Dumbbell}
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
