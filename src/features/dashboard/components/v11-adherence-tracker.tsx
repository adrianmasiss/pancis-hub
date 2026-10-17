"use client";

import { V11Card } from "@/components/shared/v11-card";

type V11AdherenceTrackerProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
  daysCount?: number;
  averagePct?: number;
};

// 28 días según el patrón visual de la referencia
const ADHERENCE_DAYS = [
  "complete",
  "complete",
  "complete",
  "complete",
  "complete",
  "partial",
  "complete",
  "complete",
  "complete",
  "complete",
  "partial",
  "complete",
  "complete",
  "complete",
  "complete",
  "complete",
  "none",
  "complete",
  "complete",
  "complete",
  "complete",
  "complete",
  "complete",
  "complete",
  "complete",
  "partial",
  "complete",
  "complete",
];

export function V11AdherenceTracker({
  index = 0,
  ...props
}: V11AdherenceTrackerProps) {
  return (
    <V11Card
      index={index}
      className="flex h-full flex-col justify-between p-6 sm:p-7"
    >
      <V11AdherenceContent {...props} />
    </V11Card>
  );
}

export function V11AdherenceContent({
  daysCount = 28,
  averagePct = 92,
}: Omit<V11AdherenceTrackerProps, "index">) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
          Adherencia
        </h3>
        <span className="border-border/60 text-muted-foreground rounded-full border bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] px-3 py-0.5 font-mono text-[12px] tabular-nums shadow-sm">
          {daysCount} días · {averagePct} % de media
        </span>
      </div>

      {/* Cuadrícula de 28 casillas táctiles de hardware */}
      <div className="adherence-days mt-4 grid grid-cols-7 gap-2">
        {ADHERENCE_DAYS.map((status, idx) => {
          let bgClass =
            "bg-primary shadow-[0_1px_4px_color-mix(in_oklab,var(--primary)_20%,transparent)]"; // Completo
          if (status === "partial")
            bgClass = "bg-[color-mix(in_oklab,var(--primary)_46%,var(--card))]"; // Parcial
          if (status === "none") bgClass = "bg-card-raised opacity-60"; // Sin registro

          return (
            <div
              key={idx}
              className={`h-6 w-full rounded-[8px] transition-[transform] duration-[240ms] ease-[var(--pc-ease-pop)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 sm:h-7 ${bgClass}`}
              title={`Día ${idx + 1}: ${status}`}
            />
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span
            className="bg-primary size-2.5 rounded-full shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
            aria-hidden="true"
          />
          <span className="text-foreground font-medium">Completo</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full bg-[color-mix(in_oklab,var(--primary)_46%,var(--card))]"
            aria-hidden="true"
          />
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="bg-card-raised size-2.5 rounded-full"
            aria-hidden="true"
          />
          <span>Sin registro</span>
        </div>
      </div>
    </>
  );
}
