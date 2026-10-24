"use client";

import { useId, useMemo, useState } from "react";
import type { ProgressData } from "@/features/progress/queries";
import type { RecordEvent } from "@/features/training/lib/stats";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import { addDaysISO } from "@/lib/dates";
import { useUnits } from "@/mobile/units";

const RANGOS = [
  { id: "4s", label: "4 sem", days: 28, desde: "hace 4 semanas" },
  { id: "3m", label: "3 m", days: 91, desde: "hace 3 meses" },
  { id: "todo", label: "Todo", days: Infinity, desde: "desde el inicio" },
] as const;

const num = (n: number, d = 1) =>
  n.toLocaleString("es-CR", { maximumFractionDigits: d });
const signo = (n: number, d = 1) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n), d)}`;

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

/**
 * Resumen de Progreso: el peso con su grafico (area degradada, rango 4 sem,
 * 3 m o todo), % de grasa, cintura, la ultima marca de fuerza y la
 * constancia. El boton abre el registro de peso y medidas de siempre.
 */
export function ProgressSummary({
  data,
  record,
  constancia,
  today,
}: {
  data: ProgressData;
  record: RecordEvent | null;
  constancia: number;
  today: string;
}) {
  const gradId = useId();
  const u = useUnits();
  const [rango, setRango] = useState<(typeof RANGOS)[number]["id"]>("4s");
  const r = RANGOS.find((x) => x.id === rango)!;
  const serie = useMemo(() => {
    const desde = Number.isFinite(r.days) ? addDaysISO(today, -r.days) : "";
    return data.weightSeries.filter((p) => p.date >= desde);
  }, [data.weightSeries, r.days, today]);

  const W = 300;
  const H = 150;
  const values = serie.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.5, max - min);
  const pts: [number, number][] = serie.map((p, i) => [
    serie.length === 1 ? W / 2 : (i / (serie.length - 1)) * W,
    10 + (1 - (p.value - min) / span) * (H - 24),
  ]);
  const line = curva(pts);
  const last = pts.at(-1);
  const delta = serie.length > 1 ? serie.at(-1)!.value - serie[0]!.value : null;

  const meds = data.measurements;
  const latestWith = (k: "bodyFatPercentage" | "waistCm") =>
    meds.find((m) => m[k] !== null) ?? null;
  const grasa = latestWith("bodyFatPercentage");
  const cintura = latestWith("waistCm");
  const anterior = (
    k: "bodyFatPercentage" | "waistCm",
    ref: (typeof meds)[number] | null,
  ) =>
    ref
      ? (meds.find((m) => m[k] !== null && m.measuredAt < ref.measuredAt) ??
        null)
      : null;
  const grasaPrev = anterior("bodyFatPercentage", grasa);
  const cinturaPrev = anterior("waistCm", cintura);

  return (
    <div className="m-body m-stagger">
      <section className="m-card" data-glow="" aria-label="Peso">
        <div
          className="m-row"
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <div>
            <div className="m-stat-label">Peso</div>
            <div className="m-stat-value" style={{ fontSize: 40 }}>
              {data.lastWeight !== null ? u.fmtWeight(data.lastWeight) : "—"}
              <small>{u.weightUnit}</small>
            </div>
            {delta !== null && (
              <div
                className="m-sub"
                style={{ fontWeight: 700, color: "var(--m-text-soft)" }}
              >
                {signo(u.weight(delta))} {u.weightUnit} · {r.desde}
              </div>
            )}
          </div>
          <div className="m-range" role="group" aria-label="Rango del gráfico">
            {RANGOS.map((x) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={x.id === rango}
                onClick={() => setRango(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
        {serie.length > 1 ? (
          <svg
            className="m-chart"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Peso de ${u.fmtWeight(serie[0]!.value)} a ${u.fmtWeight(serie.at(-1)!.value)} ${u.weightUnit}, ${r.desde}`}
            key={rango}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--m-accent)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="var(--m-accent)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((y) => (
              <line
                key={y}
                x1="0"
                x2={W}
                y1={H * y}
                y2={H * y}
                className="m-chart-grid"
              />
            ))}
            <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${gradId})`} />
            <path d={line} className="m-chart-line" pathLength={1} />
            {last && (
              <circle cx={last[0]} cy={last[1]} r="5" className="m-chart-dot" />
            )}
          </svg>
        ) : (
          <p className="m-sub">
            Registra tu peso al menos dos veces para ver la tendencia.
          </p>
        )}
        {serie.length > 1 && (
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <span className="m-stat-label">
              {r.id === "todo" ? "Inicio" : r.desde.replace(/^h/, "H")}
            </span>
            <span className="m-stat-label">Hoy</span>
          </div>
        )}
      </section>

      <div className="m-grid-2">
        <div className="m-card" data-size="sm">
          <span className="m-stat-label">% de grasa</span>
          <span className="m-stat-value" style={{ fontSize: 28 }}>
            {grasa?.bodyFatPercentage != null
              ? `${num(grasa.bodyFatPercentage)}%`
              : "—"}
          </span>
          <span className="m-sub" style={{ fontSize: 12 }}>
            {grasa && grasaPrev
              ? `${signo(grasa.bodyFatPercentage! - grasaPrev.bodyFatPercentage!)} vs medición anterior`
              : "Sin comparación aún"}
          </span>
        </div>
        <div className="m-card" data-size="sm">
          <span className="m-stat-label">Cintura</span>
          <span className="m-stat-value" style={{ fontSize: 28 }}>
            {cintura?.waistCm != null ? u.fmtLength(cintura.waistCm) : "—"}
            {cintura?.waistCm != null && <small>{u.lengthUnit}</small>}
          </span>
          <span className="m-sub" style={{ fontSize: 12 }}>
            {cintura && cinturaPrev
              ? `${signo(u.imperial ? (cintura.waistCm! - cinturaPrev.waistCm!) / 2.54 : cintura.waistCm! - cinturaPrev.waistCm!)} ${u.lengthUnit}`
              : "Sin comparación aún"}
          </span>
        </div>
        <div className="m-card" data-size="sm">
          <span
            className="m-stat-label"
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {record?.exerciseName ?? "Récord de fuerza"}
          </span>
          <span className="m-stat-value" style={{ fontSize: 28 }}>
            {record ? u.fmtWeight(record.weightKg) : "—"}
            {record && <small>{u.weightUnit}</small>}
          </span>
          <span
            className="m-sub m-accent-text"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            {record
              ? `Récord · ${signo(u.weight(record.deltaKg))} ${u.weightUnit}`
              : "Aún sin marcas"}
          </span>
        </div>
        <div className="m-card" data-size="sm">
          <span className="m-stat-label">Constancia</span>
          <span className="m-stat-value" style={{ fontSize: 28 }}>
            {constancia}%
          </span>
          <span className="m-sub" style={{ fontSize: 12 }}>
            Entreno y comidas · 7 días
          </span>
        </div>
      </div>

      <div className="m-legacy-cta">
        <MeasurementFormDialog />
      </div>
    </div>
  );
}
