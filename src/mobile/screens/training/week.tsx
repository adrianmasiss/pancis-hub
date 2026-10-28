"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import type { WeekDay, WeekState } from "./week-data";

export type { WeekDay } from "./week-data";

export const ESTADO: Record<WeekState, string> = {
  done: "Entrenado",
  repeat: "Repetido",
  plan: "Planeado",
  rest: "Descanso",
};

/**
 * Los siete dias con su estado. Tocar uno dice que paso o que toca
 * («Lunes · Entrenado · Día 2 · Pierna»); sin tocar, una leyenda pequeña.
 */
export function WeekStrip({ week }: { week: WeekDay[] }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const dia = week.find((d) => d.date === elegido) ?? null;

  return (
    <div className="m-week-wrap">
      <ol className="m-week" aria-label="Esta semana">
        {week.map((d) => {
          const etiqueta = [
            d.nombre,
            d.today ? "hoy" : null,
            ESTADO[d.state],
            d.detail,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={d.date}>
              <span className="m-week-letter" aria-hidden="true">
                {d.letra}
              </span>
              <button
                type="button"
                className="m-week-dot m-press"
                data-state={d.state}
                data-today={d.today ? "" : undefined}
                aria-pressed={elegido === d.date}
                aria-label={etiqueta}
                onClick={() => {
                  triggerHaptic("selection");
                  setElegido(elegido === d.date ? null : d.date);
                }}
              >
                {d.state === "done" && (
                  <Check size={14} strokeWidth={3} aria-hidden="true" />
                )}
                {d.state === "repeat" && <span aria-hidden="true">R</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="m-week-caption" aria-live="polite">
        {dia ? (
          <>
            <strong>
              {dia.nombre}
              {dia.today ? " (hoy)" : ""}
            </strong>{" "}
            · {ESTADO[dia.state]}
            {dia.detail ? ` · ${dia.detail}` : ""}
          </>
        ) : (
          <span className="m-week-legend" aria-hidden="true">
            <span>
              <i data-state="done" /> Entrenado
            </span>
            <span>
              <i data-state="plan" /> Planeado
            </span>
            <span>
              <i data-state="rest" /> Descanso
            </span>
            <span>
              <i data-today="" /> Hoy
            </span>
          </span>
        )}
      </p>
    </div>
  );
}
