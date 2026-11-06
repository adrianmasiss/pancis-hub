"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type {
  MeasurementView,
  SegmentKey,
  SegmentView,
} from "@/features/progress/queries";
import type { PrimaryGoal } from "@/features/progress/lib/composition";
import { changeTone, type TrendDef } from "@/features/progress/lib/trends-view";
import { useUnits } from "@/mobile/units";
import { enUnidad, fechaCorta, num, signo, unidadDe } from "./format";

/* El maniqui de siempre: `three` solo viaja si se abre la pantalla. */
const MuscleModel = dynamic(
  () =>
    import("@/features/training/components/muscle-model").then(
      (m) => m.MuscleModel,
    ),
  {
    ssr: false,
    loading: () => <div className="muscle-model-stage" aria-hidden="true" />,
  },
);

export const FUENTE: Record<string, string> = {
  inbody: "InBody",
  bascula: "Báscula",
  manual: "Manual",
  onboarding: "Medición inicial",
  otro: "Medición",
};

/**
 * Cada segmento del InBody: de que lado va su rotulo, a que altura, a que
 * punto del cuerpo apunta (en % del escenario, maniqui de frente y entero) y
 * que zonas enciende. De frente, el brazo DERECHO de la persona queda a la
 * izquierda de la pantalla.
 */
const SEGMENTOS: {
  key: SegmentKey;
  label: string;
  side: "left" | "right";
  top: number;
  dot: [number, number];
  zonas: string[];
}[] = [
  {
    key: "brazo_derecho",
    label: "Brazo der.",
    side: "left",
    top: 12,
    dot: [37.5, 33],
    zonas: ["biceps", "triceps", "deltoides", "antebrazo"],
  },
  {
    key: "brazo_izquierdo",
    label: "Brazo izq.",
    side: "right",
    top: 12,
    dot: [61, 33],
    zonas: ["biceps", "triceps", "deltoides", "antebrazo"],
  },
  {
    key: "tronco",
    label: "Tronco",
    side: "right",
    top: 38,
    dot: [50, 40],
    zonas: ["pectoral", "abdomen", "oblicuo"],
  },
  {
    key: "pierna_derecha",
    label: "Pierna der.",
    side: "left",
    top: 58,
    dot: [45, 64],
    zonas: ["cuadriceps", "aductor", "gemelo"],
  },
  {
    key: "pierna_izquierda",
    label: "Pierna izq.",
    side: "right",
    top: 60,
    dot: [53.5, 63],
    zonas: ["cuadriceps", "aductor", "gemelo"],
  },
];

const EVALUACION = { bajo: "Bajo", normal: "Normal", alto: "Alto" } as const;

type Principal = {
  key: keyof MeasurementView;
  label: string;
  def: Pick<TrendDef, "unit" | "better" | "noise">;
};

/** Las cifras que van junto al maniqui cuando no hay analisis por segmento. */
const PRINCIPALES: Principal[] = [
  {
    key: "weightKg",
    label: "Peso",
    def: { unit: "kg", better: "meta", noise: 0.3 },
  },
  {
    key: "bodyFatPercentage",
    label: "Grasa",
    def: { unit: "%", better: "baja", noise: 0.4 },
  },
  {
    key: "skeletalMuscleKg",
    label: "Músculo",
    def: { unit: "kg", better: "sube", noise: 0.3 },
  },
  {
    key: "visceralFatLevel",
    label: "Visceral",
    def: { unit: "nivel", better: "baja", noise: 0.5 },
  },
  {
    key: "totalBodyWaterL",
    label: "Agua",
    // El agua no tiene un «mejor» en ningun sentido: nunca se califica.
    def: { unit: "L", better: "sube", noise: Infinity },
  },
  {
    key: "basalMetabolicRateKcal",
    label: "Metabolismo",
    def: { unit: "kcal", better: "sube", noise: 15 },
  },
];

/** Lo que ya se ve junto al maniqui (para no repetirlo debajo). */
export const PRINCIPAL_KEYS = PRINCIPALES.map((p) => p.key);

const ENCENDIDOS = new Map<string, Record<string, number>>();

/** Las zonas encendidas, con el mismo objeto para las mismas claves: el
 * maniqui no se repinta en cada render. */
function encendidos(claves: SegmentKey[]) {
  const id = claves.join(",");
  let mapa = ENCENDIDOS.get(id);
  if (!mapa) {
    mapa = Object.fromEntries(
      SEGMENTOS.filter((s) => claves.includes(s.key)).flatMap((s) =>
        s.zonas.map((z) => [z, 1]),
      ),
    );
    ENCENDIDOS.set(id, mapa);
  }
  return mapa;
}

export const conSegmentos = (m: MeasurementView) =>
  m.segments.some((s) => s.leanMassKg !== null);

/**
 * La medicion que cuenta el cuerpo: la ultima con analisis por segmento; si
 * no, la ultima con composicion; si no, la ultima. Un pesaje suelto de ayer
 * no tapa el InBody de la semana pasada.
 */
export function medicionDelCuerpo(measurements: MeasurementView[]) {
  return (
    measurements.find(conSegmentos) ??
    measurements.find(
      (m) => m.bodyFatPercentage !== null || m.skeletalMuscleKg !== null,
    ) ??
    measurements[0] ??
    null
  );
}

/** La cifra en la unidad del usuario; las que no son kg ni cm, tal cual. */
function cifra(u: ReturnType<typeof useUnits>, p: Principal, v: number) {
  const convertible = p.def.unit === "kg" || p.def.unit === "cm";
  return {
    valor: convertible ? enUnidad(u, p.def, v) : v,
    unidad: convertible
      ? unidadDe(u, p.def)
      : p.def.unit === "nivel"
        ? ""
        : p.def.unit,
    decimales: p.def.unit === "kcal" ? 0 : 1,
  };
}

/**
 * Tu cuerpo. El maniqui esta quieto a proposito (no gira ni se acerca): si
 * se moviera, los rotulos dejarian de apuntar a su sitio.
 * - Con analisis por segmento: cada brazo, cada pierna y el tronco señalados
 *   sobre el cuerpo, con su masa magra y como la evalua el InBody.
 * - Sin el: el maniqui a un lado y las cifras principales al otro.
 * Lo demas del escaneo va en «Más del escaneo», debajo.
 */
export function BodyCard({
  measurements,
  goal,
}: {
  measurements: MeasurementView[];
  goal: PrimaryGoal | null;
}) {
  const u = useUnits();
  const m = medicionDelCuerpo(measurements);
  if (!m) return null;
  const anterior =
    measurements.find((x) => x.measuredAt < m.measuredAt) ?? null;

  const segmentos = SEGMENTOS.flatMap((s) => {
    const seg = m.segments.find((x) => x.segment === s.key);
    return seg && seg.leanMassKg !== null
      ? [{ ...s, seg, lean: seg.leanMassKg }]
      : [];
  });
  const segmental = segmentos.length > 0;
  const highlight = encendidos(segmentos.map((s) => s.key));

  return (
    <section
      className="m-card m-prog-body"
      data-layout={segmental ? "segmentos" : "lado"}
      aria-labelledby="m-prog-body-t"
    >
      <div className="m-prog-body-head">
        <h2 id="m-prog-body-t" className="m-prog-body-title">
          <span className="m-eyebrow">
            {segmental ? "Tu cuerpo por segmento" : "Tu cuerpo"}
          </span>
          <span className="m-num">
            {fechaCorta(m.measuredAt)} · {FUENTE[m.source] ?? "Medición"}
          </span>
        </h2>
        {m.inbodyScore !== null && (
          <span
            className="m-prog-body-score m-num"
            aria-label={`Puntaje InBody ${m.inbodyScore}`}
          >
            {m.inbodyScore}
            <small>puntos</small>
          </span>
        )}
      </div>

      {segmental ? (
        <div
          className="m-model m-prog-model"
          role="group"
          aria-label={`Masa magra por segmento: ${segmentos
            .map((s) => `${s.label} ${u.fmtWeight(s.lean)} ${u.weightUnit}`)
            .join(", ")}.`}
        >
          <MuscleModel tone="acento" highlight={highlight} view="front" />
          <svg
            className="m-prog-leaders"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {segmentos.map((s) => (
              <line
                key={s.key}
                x1={s.side === "left" ? 25 : 75}
                y1={s.top + 9}
                x2={s.dot[0]}
                y2={s.dot[1]}
              />
            ))}
          </svg>
          <div className="m-prog-callouts" aria-hidden="true">
            {segmentos.map((s, i) => (
              <div key={s.key} style={{ "--i": i } as CSSProperties}>
                <span
                  className="m-prog-dot"
                  style={{ left: `${s.dot[0]}%`, top: `${s.dot[1]}%` }}
                />
                <div
                  className="m-prog-callout"
                  data-side={s.side}
                  style={{ top: `${s.top}%` }}
                >
                  <span className="m-prog-callout-label">{s.label}</span>
                  <span className="m-prog-callout-value m-num">
                    {u.fmtWeight(s.lean)}
                    <small>{u.weightUnit}</small>
                  </span>
                  <SegmentoChip seg={s.seg} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="m-prog-side">
          <div className="m-model m-prog-model" aria-hidden="true">
            <MuscleModel tone="acento" highlight={highlight} view="front" />
          </div>
          <dl className="m-prog-side-list">
            {PRINCIPALES.flatMap((p, i) => {
              const v = m[p.key] as number | null;
              if (v === null) return [];
              const prev = anterior?.[p.key] as number | null | undefined;
              const delta = prev != null ? v - prev : null;
              const c = cifra(u, p, v);
              return [
                <div key={p.key} style={{ "--i": i } as CSSProperties}>
                  <dt>{p.label}</dt>
                  <dd className="m-num">
                    {num(c.valor, c.decimales)}
                    {c.unidad && <small>{c.unidad}</small>}
                  </dd>
                  {delta !== null && (
                    <span
                      className="m-prog-chip m-num"
                      data-tone={changeTone(p.def, delta, goal)}
                    >
                      {signo(cifra(u, p, delta).valor, c.decimales)}
                    </span>
                  )}
                </div>,
              ];
            })}
          </dl>
        </div>
      )}
    </section>
  );
}

/** «Normal» / «Bajo» / «Alto»: como evalua el InBody la masa magra del
 * segmento. Bajo es lo unico que pide atencion. */
function SegmentoChip({ seg }: { seg: SegmentView }) {
  if (!seg.evaluation) return null;
  return (
    <span
      className="m-prog-chip"
      data-tone={
        seg.evaluation === "bajo"
          ? "bad"
          : seg.evaluation === "normal"
            ? "good"
            : undefined
      }
    >
      {EVALUACION[seg.evaluation]}
    </span>
  );
}
