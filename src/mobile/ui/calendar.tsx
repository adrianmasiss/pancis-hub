"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthGrid, shiftMonth } from "@/features/training/lib/calendar";

const LETRAS = ["L", "K", "M", "J", "V", "S", "D"];

export type CalendarTone = "on" | "soft" | "warn" | "off";

function mesLargo(month: string): string {
  const s = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-15T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1).replace(" de ", " ");
}

/**
 * Calendario mensual de lunes a domingo. Cada dia lleva un tono (entrenado,
 * segun el plan, ajustado, sin registro) y el seleccionado va en el acento.
 */
export function MonthCalendar({
  month,
  onMonthChange,
  marks,
  selected,
  onSelect,
  today,
  legend,
  describe,
  variant = "fill",
}: {
  month: string;
  onMonthChange: (month: string) => void;
  marks: Record<string, CalendarTone>;
  selected: string | null;
  onSelect: (date: string) => void;
  today: string;
  legend: { tone: CalendarTone | "selected"; label: string }[];
  /** Texto accesible de un dia («entrenado», «sin registro»…). */
  describe: (date: string) => string;
  /** `fill`: el dia entero se tiñe (Entrenar). `dots`: un punto bajo la cifra (Nutricion). */
  variant?: "fill" | "dots";
}) {
  const grid = monthGrid(month);
  const future = shiftMonth(month, 1) > today.slice(0, 7);
  return (
    <div className="m-card" data-size="sm" data-calendar={variant}>
      <div className="m-row" style={{ justifyContent: "space-between" }}>
        <button
          type="button"
          className="m-icon-btn m-press"
          style={{ background: "transparent" }}
          aria-label="Mes anterior"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 800 }} aria-live="polite">
          {mesLargo(month)}
        </span>
        <button
          type="button"
          className="m-icon-btn m-press"
          style={{ background: "transparent" }}
          aria-label="Mes siguiente"
          disabled={future}
          onClick={() => onMonthChange(shiftMonth(month, 1))}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="m-cal" aria-hidden="true">
        {LETRAS.map((l) => (
          <span key={l} className="m-week-letter">
            {l}
          </span>
        ))}
      </div>
      <div className="m-cal" role="grid" aria-label={mesLargo(month)}>
        {grid.weeks.flat().map((date, i) =>
          date ? (
            <button
              key={date}
              type="button"
              className="m-cal-day m-num"
              data-tone={marks[date]}
              data-today={date === today ? "" : undefined}
              aria-pressed={date === selected}
              disabled={date > today}
              aria-label={`${Number(date.slice(8))}: ${describe(date)}`}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(8))}
            </button>
          ) : (
            <span key={`b${i}`} />
          ),
        )}
      </div>
      <div className="m-row" style={{ gap: 14, flexWrap: "wrap" }}>
        {legend.map((l) => (
          <span key={l.label} className="m-cal-legend" data-tone={l.tone}>
            <span aria-hidden="true" />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
