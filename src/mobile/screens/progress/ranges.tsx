"use client";

import type { CSSProperties } from "react";
import type { MeasurementView } from "@/features/progress/queries";
import type { PrimaryGoal } from "@/features/progress/lib/composition";
import {
  changeTone,
  latestPair,
  rangePosition,
  type TrendDef,
} from "@/features/progress/lib/trends-view";
import { useUnits } from "@/mobile/units";
import { enUnidad, num, signo, unidadDe } from "./format";

type Card = {
  key:
    "weightKg" | "bodyFatPercentage" | "skeletalMuscleKg" | "visceralFatLevel";
  label: string;
  def: Pick<TrendDef, "unit" | "better" | "noise">;
  /** La grasa visceral no tiene «bajo»: va de normal a alto. */
  lowZone: boolean;
  /** Rango por defecto si el informe no lo imprime (solo la visceral, que
   * InBody fija igual para todos: 1 a 9). */
  fallback?: [number, number];
};

const CARDS: Card[] = [
  {
    key: "weightKg",
    label: "Peso",
    def: { unit: "kg", better: "meta", noise: 0.3 },
    lowZone: true,
  },
  {
    key: "bodyFatPercentage",
    label: "% de grasa",
    def: { unit: "%", better: "baja", noise: 0.4 },
    lowZone: true,
  },
  {
    key: "skeletalMuscleKg",
    label: "Masa muscular",
    def: { unit: "kg", better: "sube", noise: 0.3 },
    lowZone: true,
  },
  {
    key: "visceralFatLevel",
    label: "Grasa visceral",
    def: { unit: "nivel", better: "baja", noise: 0.5 },
    lowZone: false,
    fallback: [1, 9],
  },
];

const ZONAS_3 = ["Bajo", "Normal", "Alto"] as const;
const ZONAS_2 = ["Normal", "Alto"] as const;

/**
 * Las cuatro cifras del InBody con su rango normal, como las imprime el
 * informe: Bajo · Normal · Alto y una marca donde caes. El rango sale del
 * propio informe (`referenceRanges`); sin el, no se dibuja la barra, no se
 * inventa uno.
 */
export function RangeCards({
  measurements,
  goal,
}: {
  measurements: MeasurementView[];
  goal: PrimaryGoal | null;
}) {
  const u = useUnits();
  const cards = CARDS.flatMap((c) => {
    const { current, previous } = latestPair(measurements, c.key);
    if (!current) return [];
    const value = current[c.key] as number;
    const delta = previous ? value - (previous[c.key] as number) : null;
    const rango = current.referenceRanges?.[c.key] ?? c.fallback ?? null;
    return [{ ...c, value, delta, rango }];
  });
  if (cards.length === 0) return null;

  return (
    <div className="m-grid-2 m-prog-ranges">
      {cards.map((c, i) => {
        const tone = changeTone(c.def, c.delta, goal);
        const en = (v: number) =>
          c.def.unit === "nivel" ? v : enUnidad(u, c.def, v);
        const unidad = c.def.unit === "nivel" ? "nivel" : unidadDe(u, c.def);
        const r = c.rango ? rangePosition(c.value, c.rango, c.lowZone) : null;
        const zonas = c.lowZone ? ZONAS_3 : ZONAS_2;
        return (
          <section
            key={c.key}
            className="m-card m-prog-range"
            style={{ "--i": i } as CSSProperties}
            aria-label={`${c.label}: ${num(en(c.value))} ${unidad}${r ? `, ${r.zone}` : ""}`}
          >
            <span className="m-prog-range-label">{c.label}</span>
            <div className="m-prog-range-row">
              <span className="m-prog-range-value m-num">
                {num(en(c.value))}
                <small>{unidad}</small>
              </span>
              {c.delta !== null && (
                <span className="m-prog-chip m-num" data-tone={tone}>
                  {signo(en(c.delta))}
                </span>
              )}
            </div>
            {r ? (
              <>
                <div
                  className="m-prog-range-bar"
                  data-zones={zonas.length}
                  aria-hidden="true"
                >
                  {zonas.map((z) => (
                    <span
                      key={z}
                      data-normal={z === "Normal" ? "" : undefined}
                    />
                  ))}
                  <i style={{ "--pos": r.pos } as CSSProperties} />
                </div>
                <div className="m-prog-range-zones" aria-hidden="true">
                  {zonas.map((z) => (
                    <span
                      key={z}
                      data-on={z.toLowerCase() === r.zone ? "" : undefined}
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <span className="m-sub m-prog-range-none">
                Sin rango en el informe
              </span>
            )}
          </section>
        );
      })}
    </div>
  );
}
