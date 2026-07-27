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
      {/*
        Hero del handoff v2: min-height 190px, radio de tarjeta, degradado
        diagonal calido y un halo radial de acento desplazado a la derecha.
        La palabra final del titular va en --primary-strong.
      */}
      <div
        className="relative flex min-h-[190px] flex-col justify-center gap-4 overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 78% 50%, color-mix(in oklch, var(--primary) 35%, transparent), transparent 60%), linear-gradient(120deg, oklch(0.19 0.02 35), oklch(0.24 0.05 30))",
        }}
      >
        {/* Marca de agua: el glifo de la seccion, grande y al filo derecho. */}
        <Flame
          aria-hidden="true"
          strokeWidth={1}
          className="text-primary pointer-events-none absolute -right-4 top-1/2 size-[150px] -translate-y-1/2 opacity-50"
        />

        <div className="relative flex min-w-0 flex-col gap-1.5">
          <p className="text-[11px] font-semibold tracking-[0.9px] text-white/70 uppercase">
            <span className="first-letter:uppercase">{longDate}</span>
            {goalLabel ? (
              <>
                <span aria-hidden="true"> &middot; </span>
                {goalLabel}
              </>
            ) : null}
          </p>
          <h2 className="text-[24px] leading-[1.25] font-extrabold tracking-[-0.3px] text-white">
            {greetingForHour(hour)}
            {data.displayName ? (
              <>
                ,{" "}
                <span className="text-[var(--primary-strong)]">
                  {data.displayName}
                </span>
              </>
            ) : null}
          </h2>
          <p className="text-[14px] text-white/80">{h.tagline}</p>
        </div>

        <div className="relative">
          <Button
            asChild
            className="border border-white/15 bg-white/10 text-[13.5px] font-semibold text-white hover:bg-white/20"
          >
            <Link href="/nutricion">
              {h.cta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
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
