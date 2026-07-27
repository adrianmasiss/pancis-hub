import Link from "next/link";
import { ArrowRight, CalendarCheck, Dumbbell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard;
const h = messages.dashboard.hero;

function greetingForHour(hour: number): string {
  if (hour < 12) return t.greetingMorning;
  if (hour < 19) return t.greetingAfternoon;
  return t.greetingEvening;
}

/**
 * Lectura de la franja de estado. El icono acompana a la etiqueta, no al valor:
 * asi la columna de cifras queda limpia y alineada entre celdas.
 */
function Readout({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-card flex min-w-0 flex-col gap-2 px-5 py-4 sm:px-6 sm:py-5">
      <p className="label-micro flex items-center gap-2">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </p>
      <p className="num truncate text-xl leading-none font-medium sm:text-[1.375rem]">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground truncate text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Cabecera del panel de inicio. Abre con estado, no con eslogan: una linea de
 * saludo y tres lecturas del dia por encima del pliegue.
 */
export function HeroBanner({ data }: { data: DashboardData }) {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: data.timezone,
    }).format(now),
  );
  const longDate = new Intl.DateTimeFormat("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: data.timezone,
  }).format(now);

  const goalLabel = data.primaryGoal
    ? t.goals[data.primaryGoal as keyof typeof t.goals]
    : null;

  // Calorias: valor y pista contextual segun objetivo del dia.
  const consumed = Math.round(data.consumed.calories);
  const target = data.targets ? Math.round(data.targets.calories) : null;
  let caloriesValue: string;
  let caloriesHint: string | undefined;
  if (target) {
    const diff = target - consumed;
    caloriesValue = `${consumed.toLocaleString("es-419")} / ${target.toLocaleString("es-419")}`;
    caloriesHint =
      diff >= 0
        ? `${diff.toLocaleString("es-419")} ${h.caloriesRemaining}`
        : `${Math.abs(diff).toLocaleString("es-419")} ${h.caloriesExceeded}`;
  } else {
    caloriesValue = consumed.toLocaleString("es-419");
    caloriesHint = h.caloriesNoTarget;
  }

  const nextTraining = data.training.activePlanName
    ? (data.training.nextDayName ?? h.restDay)
    : h.noPlan;

  return (
    <section className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="label-micro">
            <span className="first-letter:uppercase">{longDate}</span>
            {goalLabel ? (
              <>
                <span aria-hidden="true"> &middot; </span>
                {goalLabel}
              </>
            ) : null}
          </p>
          {/* Linea de apertura del producto: va en escala de display, que es
              lo que separa un panel de datos de una portada editorial. */}
          <h2 className="truncate text-[1.75rem] font-medium tracking-[-0.03em] sm:display-title">
            {greetingForHour(hour)}
            {data.displayName ? `, ${data.displayName}` : null}
          </h2>
        </div>

        <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
          <Link href="/nutricion">
            {h.cta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {/*
        Rejilla de filete compartido: el fondo asoma 1px entre celdas, de modo
        que las lecturas se separan sin tarjetas sueltas ni sombras.
      */}
      <div className="bg-hairline border-hairline grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
        <Readout
          icon={Flame}
          label={h.caloriesLabel}
          value={caloriesValue}
          hint={caloriesHint}
        />
        <Readout
          icon={Dumbbell}
          label={h.nextTrainingLabel}
          value={nextTraining}
        />
        <Readout
          icon={CalendarCheck}
          label={h.activeDaysLabel}
          value={`${data.adherence.mealDays7}`}
          hint={h.activeDaysUnit}
        />
      </div>
    </section>
  );
}
