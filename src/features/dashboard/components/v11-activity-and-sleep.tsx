"use client";

import { V11AdherenceContent } from "./v11-adherence-tracker";
import { V11Card } from "@/components/shared/v11-card";

type V11ActivityCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
  activeDayIndex?: number;
  activeMinutes?: number;
};

const DAYS = [
  { label: "Lun", height: 50 },
  { label: "Mar", height: 68 },
  { label: "Mié", height: 42 },
  { label: "Jue", height: 95, active: true },
  { label: "Vie", height: 60 },
  { label: "Sáb", height: 35 },
  { label: "Dom", height: 58 },
];

export function V11ActivityCard({
  activeMinutes = 62,
  index = 0,
}: V11ActivityCardProps) {
  return (
    <V11Card
      index={index}
      className="activity-card flex h-full flex-col p-6 sm:p-7"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
          Actividad de la semana
        </h3>
        <span className="border-border/60 text-muted-foreground rounded-full border bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] px-3 py-0.5 text-[12px] shadow-sm">
          Esta semana
        </span>
      </div>

      {/* Gráfico de barras Lun-Dom */}
      <div className="mt-8 flex h-36 items-end justify-between gap-2 px-2 pb-1">
        {DAYS.map((day) => (
          <div
            key={day.label}
            className="flex flex-1 flex-col items-center gap-3"
          >
            <div className="relative flex h-24 w-full flex-col items-center justify-end">
              {day.active && (
                <div className="absolute -top-7 z-10 flex flex-col items-center">
                  <div className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap tabular-nums shadow-[0_4px_12px_color-mix(in_oklab,var(--primary)_30%,transparent)]">
                    {activeMinutes} min
                  </div>
                  {/* Caret hacia abajo */}
                  <div className="border-t-primary size-0 border-x-4 border-t-4 border-x-transparent" />
                </div>
              )}
              <div
                className={`w-full max-w-[14px] rounded-full transition-[height,background-color] duration-[260ms] ease-[var(--pc-ease-out)] ${
                  day.active
                    ? "bg-gradient-to-t from-[var(--chart-1)] to-[var(--pc-chart-to)] shadow-[0_0_16px_color-mix(in_oklab,var(--pc-brand-from,var(--primary))_50%,transparent)]"
                    : "bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--foreground)_25%,transparent)]"
                }`}
                style={{ height: `${day.height}%` }}
              />
            </div>
            <span
              className={`text-[12px] ${
                day.active
                  ? "text-foreground font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
      <div className="border-border/60 mt-6 border-t pt-5">
        <V11AdherenceContent />
      </div>
    </V11Card>
  );
}

type V11SleepCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
  totalSleep?: string;
  deepSleep?: string;
  deltaText?: string;
};

export function V11SleepCard({
  totalSleep = "6 h 40 min",
  deepSleep = "1 h 10",
  deltaText = "22 min por debajo de tu media",
  index = 0,
}: V11SleepCardProps) {
  return (
    <V11Card
      index={index}
      className="flex h-full flex-col justify-between p-6 sm:p-7"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
          Sueño
        </h3>
        <span className="border-border/60 text-muted-foreground rounded-full border bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] px-3 py-0.5 font-mono text-[12px] tabular-nums shadow-sm">
          {totalSleep}
        </span>
      </div>

      {/* Cifra y descripción */}
      <div className="my-6">
        <p className="text-foreground text-[34px] leading-none font-black tracking-[-0.03em] tabular-nums">
          {deepSleep}
        </p>
        <p className="text-muted-foreground mt-2 text-[13px]">
          de sueño profundo · {deltaText}
        </p>
      </div>

      {/* Onda de sueño dorada en la base con filtro suave */}
      <div
        className="relative mt-2 h-10 w-full overflow-visible"
        aria-hidden="true"
      >
        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 400 36"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 18 C 60 4, 120 32, 180 14 C 240 0, 300 28, 400 16"
            stroke="var(--chart-1)"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-80 drop-shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
          />
        </svg>
      </div>
    </V11Card>
  );
}
