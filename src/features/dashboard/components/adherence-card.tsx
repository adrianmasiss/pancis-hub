import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.adherence;

const WEEKDAY = ["D", "L", "M", "M", "J", "V", "S"];

function weekdayLetter(date: string) {
  return WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

/**
 * Adherencia de la semana.
 *
 * Las dos cifras resumen; la tira de siete dias responde la pregunta que las
 * cifras dejan abierta ("¿donde se me cayo la semana?"). Antes la tarjeta solo
 * tenia los dos numeros y quedaba medio vacia al lado de la de entrenamiento.
 *
 * Cada dia se lee por posicion y por glifo, no solo por color: la casilla
 * tenida marca el dia con comidas y el punto relleno el dia con entreno.
 */
export function AdherenceCard({ data }: { data: DashboardData }) {
  const { adherence } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="truncate">{t.title}</span>
          <span className="label-micro shrink-0">7 días</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Las dos metricas comparten un filete vertical en lugar de vivir en
            cajas propias: menos contorno, misma separacion. */}
        <div className="divide-hairline grid grid-cols-2 divide-x">
          <MetricCard label={t.workouts} value={`${adherence.workouts7}`} />
          <MetricCard
            className="pl-5"
            label={t.meals}
            value={`${adherence.mealDays7} / 7`}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="label-micro">{t.weekLabel}</p>
          <ol className="grid grid-cols-7 gap-1.5">
            {adherence.days.map((day, index) => {
              const isToday = index === adherence.days.length - 1;
              const summary = `${day.date}: ${
                day.trained ? t.dayTrained : t.dayNoTraining
              }, ${day.ate ? t.dayAte : t.dayNoMeals}`;

              return (
                <li
                  key={day.date}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "text-[0.625rem]",
                      isToday
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {weekdayLetter(day.date)}
                  </span>
                  <span
                    title={summary}
                    className={cn(
                      "border-hairline flex h-9 w-full items-center justify-center rounded-sm border",
                      day.ate ? "bg-muted" : "bg-transparent",
                      isToday && "border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        day.trained ? "bg-primary" : "bg-muted-foreground/25",
                      )}
                      aria-hidden="true"
                    />
                    <span className="sr-only">{summary}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-muted-foreground text-[0.6875rem]">{t.legend}</p>
        </div>
      </CardContent>
    </Card>
  );
}
