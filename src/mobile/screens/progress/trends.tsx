"use client";

import { useId, useRef, useState } from "react";
import type { MeasurementView } from "@/features/progress/queries";
import type { PrimaryGoal } from "@/features/progress/lib/composition";
import {
  TRENDS,
  changeTone,
  inRange,
  seriesOf,
  trendDef,
  type Point,
  type TrendKey,
} from "@/features/progress/lib/trends-view";
import { addDaysISO } from "@/lib/dates";
import { triggerHaptic } from "@/lib/haptics";
import { Segmented } from "@/mobile/ui/controls";
import { Haptic } from "@/mobile/ui/haptic";
import { useCountUp } from "@/mobile/ui/use-count-up";
import { useUnits } from "@/mobile/units";
import { enUnidad, fechaCorta, num, signo, unidadDe } from "./format";

const RANGOS = [
  {
    id: "4s",
    label: "4 sem",
    days: 28,
    texto: "en 4 semanas",
    titulo: "4 semanas",
  },
  { id: "3m", label: "3 m", days: 91, texto: "en 3 meses", titulo: "3 meses" },
  {
    id: "todo",
    label: "Todo",
    days: Infinity,
    texto: "desde el inicio",
    titulo: "todo",
  },
] as const;
type RangoId = (typeof RANGOS)[number]["id"];

/** Las tres de la pestaña; las demas se eligen desde la lista. */
const PESTANAS: TrendKey[] = [
  "weightKg",
  "bodyFatPercentage",
  "skeletalMuscleKg",
];

/** Curva suave (Catmull-Rom → Bezier) por los puntos. */
function curva(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function puntos(serie: readonly Point[], W: number, H: number, pad = 8) {
  const vals = serie.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(0.5, max - min);
  return serie.map(
    (p, i) =>
      [
        serie.length === 1 ? W / 2 : (i / (serie.length - 1)) * W,
        pad + (1 - (p.value - min) / span) * (H - pad * 2),
      ] as [number, number],
  );
}

/**
 * La tendencia: Peso, Grasa o Músculo en pestañas (y cualquier medida desde
 * la lista de abajo), con su rango, el cambio y el area bajo la curva en el
 * color de la metrica. Debajo, todas las mediciones del rango con su mini
 * grafico; tocar una la pone en el grafico.
 */
export function Trends({
  measurements,
  goal,
  today,
}: {
  measurements: MeasurementView[];
  goal: PrimaryGoal | null;
  today: string;
}) {
  const u = useUnits();
  const gradId = useId();
  const cardRef = useRef<HTMLElement>(null);
  const [metric, setMetric] = useState<TrendKey>("weightKg");
  const [rangoId, setRangoId] = useState<RangoId>("4s");
  const rango = RANGOS.find((r) => r.id === rangoId)!;
  // El rango cuenta hacia atras desde la ultima medicion, no desde hoy: si
  // la ultima fue hace dos meses, «4 sem» sigue mostrando un cambio.
  const ancla = measurements[0]?.measuredAt ?? today;
  const desde = Number.isFinite(rango.days)
    ? addDaysISO(ancla, -rango.days)
    : "";

  const filas = TRENDS.flatMap((def) => {
    const toda = seriesOf(measurements, def.key);
    if (toda.length === 0) return [];
    const serie = inRange(toda, desde);
    const ultimo = toda.at(-1)!;
    const primero = serie[0] ?? ultimo;
    const delta = serie.length > 1 ? ultimo.value - primero.value : null;
    return [{ def, serie, ultimo, primero, delta }];
  });
  const elegida = filas.find((f) => f.def.key === metric) ?? filas[0];
  // La cifra grande cuenta hasta la nueva al cambiar de metrica o de rango.
  const valor = elegida ? enUnidad(u, elegida.def, elegida.ultimo.value) : 0;
  const mostrado = useCountUp(Math.round(valor * 10)) / 10;
  if (!elegida) return null;

  const actual = elegida;
  const def = actual.def;
  const tone = changeTone(def, actual.delta, goal);

  const W = 320;
  const H = 120;
  const pts = puntos(actual.serie, W, H);
  const linea = curva(pts);
  const fin = pts.at(-1);
  const pestanas = PESTANAS.filter((k) => filas.some((f) => f.def.key === k));

  const elegir = (key: TrendKey, desdeLista = false) => {
    if (key === metric) return;
    triggerHaptic("selection");
    setMetric(key);
    // Desde la lista, el grafico queda arriba: se sube a verlo.
    if (desdeLista) {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      cardRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    }
  };

  return (
    <>
      <section
        ref={cardRef}
        className="m-card m-prog-trend"
        style={{ "--metric": def.color } as React.CSSProperties}
        aria-label={`Tendencia de ${def.label}`}
      >
        {pestanas.length > 1 && (
          <Segmented
            label="Métrica del gráfico"
            value={PESTANAS.includes(metric) ? metric : ("" as TrendKey)}
            onChange={(k) => elegir(k)}
            options={pestanas.map((k) => ({
              value: k,
              label: trendDef(k).short,
            }))}
          />
        )}
        <div className="m-prog-trend-head">
          <div style={{ minWidth: 0 }}>
            <span className="m-eyebrow">{def.label}</span>
            <div className="m-prog-trend-value m-num">
              {num(mostrado)}
              <small>{unidadDe(u, def)}</small>
            </div>
            <span className="m-prog-trend-delta m-num" data-tone={tone}>
              {actual.delta !== null
                ? `${signo(enUnidad(u, def, actual.delta))} ${unidadDe(u, def)} ${rango.texto}`
                : "Sin cambio que medir aún"}
            </span>
          </div>
          <div className="m-range" role="group" aria-label="Rango del gráfico">
            {RANGOS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={r.id === rangoId}
                onClick={() => {
                  if (r.id !== rangoId) triggerHaptic("selection");
                  setRangoId(r.id);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {actual.serie.length > 1 ? (
          <svg
            className="m-chart m-prog-chart"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${def.label} de ${num(enUnidad(u, def, actual.primero.value))} a ${num(valor)} ${unidadDe(u, def)}, ${rango.texto}`}
            key={`${metric}-${rangoId}`}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={def.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={def.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="m-prog-chart-area"
              d={`${linea} L${W},${H} L0,${H} Z`}
              fill={`url(#${gradId})`}
            />
            <path d={linea} className="m-chart-line" pathLength={1} />
            {fin && (
              <circle cx={fin[0]} cy={fin[1]} r="4.5" className="m-chart-dot" />
            )}
          </svg>
        ) : (
          <p className="m-sub">
            Hace falta otra medición de {def.label.toLowerCase()} para ver la
            tendencia.
          </p>
        )}
        {actual.serie.length > 1 && (
          <div className="m-prog-trend-axis m-num">
            <span>{fechaCorta(actual.primero.date)}</span>
            <span>{fechaCorta(actual.ultimo.date)}</span>
          </div>
        )}
      </section>

      <section className="m-stack m-prog-list" aria-labelledby="m-prog-list-t">
        <h2 id="m-prog-list-t" className="m-eyebrow">
          Mediciones · {rango.titulo}
        </h2>
        <ul>
          {filas.map((f) => {
            const t = changeTone(f.def, f.delta, goal);
            const sp = puntos(f.serie, 72, 26, 4);
            return (
              <li key={f.def.key}>
                <button
                  type="button"
                  className="m-prog-row m-press"
                  aria-pressed={f.def.key === metric}
                  onClick={() => elegir(f.def.key, true)}
                  style={{ "--metric": f.def.color } as React.CSSProperties}
                >
                  <Haptic />
                  <span className="m-prog-row-name">
                    <span>{f.def.label}</span>
                    <small className="m-num">
                      desde {num(enUnidad(u, f.def, f.primero.value))}{" "}
                      {unidadDe(u, f.def)}
                    </small>
                  </span>
                  <svg
                    className="m-prog-spark"
                    viewBox="0 0 72 26"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {sp.length > 1 && (
                      <>
                        <path
                          d={`${curva(sp)} L72,26 L0,26 Z`}
                          className="m-prog-spark-area"
                        />
                        <path d={curva(sp)} className="m-prog-spark-line" />
                        <circle
                          cx={sp.at(-1)![0]}
                          cy={sp.at(-1)![1]}
                          r="2.6"
                          className="m-prog-spark-dot"
                        />
                      </>
                    )}
                  </svg>
                  <span className="m-prog-row-value m-num">
                    {num(enUnidad(u, f.def, f.ultimo.value))}
                    <small>{unidadDe(u, f.def)}</small>
                  </span>
                  <span className="m-prog-chip m-num" data-tone={t}>
                    {f.delta !== null
                      ? `${signo(enUnidad(u, f.def, f.delta))} ${unidadDe(u, f.def)}`
                      : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
