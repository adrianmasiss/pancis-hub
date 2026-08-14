import Link from "next/link";
import { Dumbbell, Play, Timer, Flame, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
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
    <Section
      title={t.title}
      action={
        <Link
          href="/entrenamiento"
          className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs transition-colors duration-150"
        >
          Ver rutinas
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      }
    >
      <div className="flex flex-col gap-5">
        {training.activePlanName ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {training.estimatedMinutes ? (
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Timer className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="num">
                      ~{training.estimatedMinutes}
                    </span>{" "}
                    {t.minutes}
                  </span>
                ) : null}
              </div>
              <p className="text-[0.9375rem] leading-snug font-medium">
                {training.activePlanName}
              </p>
              {training.nextDayName ? (
                <p className="text-muted-foreground text-[0.8125rem]">
                  {training.nextDayName}
                </p>
              ) : null}
            </div>

            {training.mainExercises.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <p className="label-micro">{t.mainExercises}</p>
                {/* Filete compartido: las filas se separan con una linea, no
                    con fondos de color. */}
                <ul className="divide-hairline border-hairline divide-y border-y">
                  {training.mainExercises.map((name) => (
                    <li key={name} className="truncate py-2.5 text-[0.8125rem]">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild className="shrink-0">
                <Link href="/entrenamiento">
                  <Play className="size-4" aria-hidden="true" />
                  {t.start}
                </Link>
              </Button>
              {training.lastSession ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Flame className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {t.lastSession}: {formatDate(training.lastSession.date)}
                    <span aria-hidden="true"> &middot; </span>
                    <span className="num text-foreground">
                      {training.lastSession.setsCount}
                    </span>{" "}
                    {t.setsLogged}
                  </span>
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <EmptyState
            title={t.noPlan}
            description={messages.emptyStates.training.description}
            icon={Dumbbell}
          />
        )}
      </div>
    </Section>
  );
}
