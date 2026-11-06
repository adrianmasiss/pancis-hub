"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type {
  MeasurementView,
  SegmentKey,
  SegmentView,
} from "@/features/progress/queries";
import type { PrimaryGoal } from "@/features/progress/lib/composition";
import { changeTone, type TrendDef } from "@/features/progress/lib/trends-view";
import { triggerHaptic } from "@/lib/haptics";
import { Segmented } from "@/mobile/ui/controls";
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
 * punto del cuerpo apunta (en % del escenario, maniqui de frente y entero),
 * que zonas enciende y de que lado del modelo. De frente, el brazo DERECHO
 * de la persona queda a la izquierda de la pantalla.
 */
const SEGMENTOS: {
  key: SegmentKey;
  label: string;
  side: "left" | "right";
  top: number;
  dot: [number, number];
  zonas: string[];
  lado: -1 | 1 | null;
}[] = [
  {
    key: "brazo_derecho",
    label: "Brazo derecho",
    side: "left",
    top: 12,
    dot: [37.5, 33],
    zonas: ["biceps", "triceps", "deltoides", "antebrazo"],
    lado: -1,
  },
  {
    key: "brazo_izquierdo",
    label: "Brazo izquierdo",
    side: "right",
    top: 12,
    dot: [61, 33],
    zonas: ["biceps", "triceps", "deltoides", "antebrazo"],
    lado: 1,
  },
  {
    key: "tronco",
    label: "Tronco",
    side: "right",
    top: 38,
    dot: [50, 40],
    zonas: ["pectoral", "abdomen", "oblicuo"],
    lado: null,
  },
  {
    key: "pierna_derecha",
    label: "Pierna derecha",
    side: "left",
    top: 58,
    dot: [45, 64],
    zonas: ["cuadriceps", "aductor", "gemelo"],
    lado: -1,
  },
  {
    key: "pierna_izquierda",
    label: "Pierna izquierda",
    side: "right",
    top: 60,
    dot: [53.5, 63],
    zonas: ["cuadriceps", "aductor", "gemelo"],
    lado: 1,
  },
];

const EVALUACION = { bajo: "Bajo", normal: "Normal", alto: "Alto" } as const;

type Principal = {
  key: keyof MeasurementView;
  label: string;
  def: Pick<TrendDef, "unit" | "better" | "noise">;
};

/** Las tres cifras bajo el maniqui; lo demas, en «Más del escaneo». */
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
];

/** Lo que ya se ve junto al maniqui (para no repetirlo debajo). */
export const PRINCIPAL_KEYS = PRINCIPALES.map((p) => p.key);

/* Bajo esto, la diferencia entre un lado y otro es ruido de la bascula. */
const RUIDO_LADOS_KG = 0.1;

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
    unidad: convertible ? unidadDe(u, p.def) : p.def.unit,
    decimales: 1,
  };
}

type Segmento = (typeof SEGMENTOS)[number] & { seg: SegmentView; lean: number };

const VISTAS = [
  { value: "resumen", label: "Resumen" },
  { value: "segmentos", label: "Segmentos" },
] as const;

/**
 * Tu cuerpo, en dos vistas sobre el mismo maniqui quieto (si se moviera, el
 * punto dejaria de caer en su sitio):
 * - Resumen: peso, grasa y musculo con su cambio.
 * - Segmentos, solo si el InBody los trae: derecha contra izquierda en
 *   barras; al tocar una, el maniqui la señala.
 * Lo demas del escaneo va en «Más del escaneo», debajo.
 */
export function BodyCard({
  measurements,
  goal,
  onVerTodo,
}: {
  measurements: MeasurementView[];
  goal: PrimaryGoal | null;
  /** Abre «Más del escaneo» y baja hasta el. */
  onVerTodo: () => void;
}) {
  const u = useUnits();
  const [vista, setVista] = useState<"resumen" | "segmentos">("resumen");
  const [sel, setSel] = useState<SegmentKey | null>(null);
  const m = medicionDelCuerpo(measurements);
  if (!m) return null;
  const anterior =
    measurements.find((x) => x.measuredAt < m.measuredAt) ?? null;

  const segmentos: Segmento[] = SEGMENTOS.flatMap((s) => {
    const seg = m.segments.find((x) => x.segment === s.key);
    return seg && seg.leanMassKg !== null
      ? [{ ...s, seg, lean: seg.leanMassKg }]
      : [];
  });
  const segmental = segmentos.length > 0;
  const enSegmentos = segmental && vista === "segmentos";
  const elegido = enSegmentos
    ? (segmentos.find((s) => s.key === sel) ?? null)
    : null;
  const highlight = encendidos(
    !enSegmentos ? [] : elegido ? [elegido.key] : segmentos.map((s) => s.key),
  );

  return (
    <section
      className="m-card m-prog-body"
      data-vista={enSegmentos ? "segmentos" : "resumen"}
      aria-labelledby="m-prog-body-t"
    >
      <div className="m-prog-body-head">
        <h2 id="m-prog-body-t" className="m-prog-body-title">
          <span className="m-eyebrow">
            {enSegmentos ? "Masa magra" : "Tu cuerpo"}
            {m.inbodyScore !== null && ` · ${m.inbodyScore} pts`}
          </span>
          <span className="m-num">
            {fechaCorta(m.measuredAt)} · {FUENTE[m.source] ?? "Medición"}
          </span>
        </h2>
        {segmental && (
          <Segmented
            value={vista}
            onChange={(v) => {
              setVista(v);
              setSel(null);
            }}
            options={VISTAS}
            label="Vista del cuerpo"
          />
        )}
      </div>

      <div
        className="m-model m-prog-model"
        data-sel={elegido ? "" : undefined}
        aria-hidden="true"
      >
        <MuscleModel
          tone="acento"
          highlight={highlight}
          view="front"
          lado={elegido?.lado ?? null}
        />
        {elegido && <Senal key={elegido.key} s={elegido} u={u} />}
      </div>

      <div className="m-prog-body-view" key={enSegmentos ? "seg" : "res"}>
        {enSegmentos ? (
          <Balance
            segmentos={segmentos}
            sel={sel}
            onSel={(k) => {
              triggerHaptic("selection");
              setSel(sel === k ? null : k);
            }}
          />
        ) : (
          <dl className="m-prog-stats">
            {PRINCIPALES.map((p) => {
              const v = m[p.key] as number | null;
              const prev = anterior?.[p.key] as number | null | undefined;
              const delta = v !== null && prev != null ? v - prev : null;
              const c = v !== null ? cifra(u, p, v) : null;
              return (
                <div key={p.key}>
                  <dt>{p.label}</dt>
                  <dd className="m-num">
                    {c ? num(c.valor, c.decimales) : "—"}
                    {c && <small>{c.unidad}</small>}
                  </dd>
                  {delta !== null && c && (
                    <span
                      className="m-prog-chip m-num"
                      data-tone={changeTone(p.def, delta, goal)}
                    >
                      {signo(cifra(u, p, delta).valor, c.decimales)}
                    </span>
                  )}
                </div>
              );
            })}
          </dl>
        )}
      </div>

      {!segmental && (
        <p className="m-prog-body-note">
          Este escaneo no trae análisis por segmento.
        </p>
      )}
      <button
        type="button"
        className="m-prog-body-more m-press"
        onClick={onVerTodo}
      >
        Ver todo el escaneo
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    </section>
  );
}

/** El segmento elegido señalado sobre el cuerpo: punto, linea y rotulo. */
function Senal({ s, u }: { s: Segmento; u: ReturnType<typeof useUnits> }) {
  return (
    <>
      <svg
        className="m-prog-leaders"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={s.side === "left" ? 25 : 75}
          y1={s.top + 9}
          x2={s.dot[0]}
          y2={s.dot[1]}
        />
      </svg>
      <div className="m-prog-callouts">
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
    </>
  );
}

/**
 * Derecha contra izquierda: cada barra sale del centro hacia su lado, con
 * la escala de la extremidad mas grande (al 85 %, para que no se vea todo
 * lleno), para que se note si un lado va atras.
 * Cada lado se toca; el tronco, entero.
 */
function Balance({
  segmentos,
  sel,
  onSel,
}: {
  segmentos: Segmento[];
  sel: SegmentKey | null;
  onSel: (k: SegmentKey) => void;
}) {
  const u = useUnits();
  const de = (k: SegmentKey) => segmentos.find((s) => s.key === k) ?? null;
  const max = Math.max(
    ...segmentos.filter((s) => s.key !== "tronco").map((s) => s.lean),
    0.1,
  );
  const tronco = de("tronco");
  const filas = [
    { nombre: "Brazos", der: de("brazo_derecho"), izq: de("brazo_izquierdo") },
    {
      nombre: "Piernas",
      der: de("pierna_derecha"),
      izq: de("pierna_izquierda"),
    },
  ].filter((f) => f.der || f.izq);

  const lado = (s: Segmento | null, cual: "der" | "izq", nombre: string) =>
    s ? (
      <button
        type="button"
        className="m-prog-bal-side m-press"
        data-lado={cual}
        aria-pressed={sel === s.key}
        aria-label={`${s.label}: ${u.fmtWeight(s.lean)} ${u.weightUnit}${
          s.seg.evaluation ? `, ${EVALUACION[s.seg.evaluation]}` : ""
        }`}
        onClick={() => onSel(s.key)}
      >
        <span className="m-prog-bal-value m-num">
          {u.fmtWeight(s.lean)}
          <small>{u.weightUnit}</small>
        </span>
        <span
          className="m-prog-bal-bar"
          data-tone={s.seg.evaluation === "bajo" ? "bad" : undefined}
        >
          <i style={{ width: `${Math.min(100, (s.lean / max) * 85)}%` }} />
        </span>
      </button>
    ) : (
      <span
        className="m-prog-bal-side"
        data-lado={cual}
        aria-label={`${nombre} sin dato`}
      />
    );

  return (
    <div className="m-prog-bal" role="group" aria-label="Masa magra por lado">
      <div className="m-prog-bal-head" aria-hidden="true">
        <span>Derecha</span>
        <span>Izquierda</span>
      </div>
      {filas.map((f) => {
        const dif = f.der && f.izq ? f.der.lean - f.izq.lean : null;
        const bajo = [f.der, f.izq].find((s) => s?.seg.evaluation === "bajo");
        const nota =
          dif === null
            ? ""
            : Math.abs(dif) < RUIDO_LADOS_KG
              ? "iguales"
              : `${dif > 0 ? "der." : "izq."} +${u.fmtWeight(Math.abs(dif))}`;
        return (
          <div key={f.nombre} className="m-prog-bal-row">
            <span className="m-prog-bal-name">
              {f.nombre}
              {nota && <span className="m-num"> · {nota}</span>}
              {bajo && <b> · {bajo.side === "left" ? "der." : "izq."} bajo</b>}
            </span>
            {lado(f.der, "der", f.nombre)}
            {lado(f.izq, "izq", f.nombre)}
          </div>
        );
      })}
      {tronco && (
        <button
          type="button"
          className="m-prog-bal-trunk m-press"
          aria-pressed={sel === "tronco"}
          onClick={() => onSel("tronco")}
        >
          <span>Tronco</span>
          <span className="m-prog-bal-value m-num">
            {u.fmtWeight(tronco.lean)}
            <small>{u.weightUnit}</small>
            <SegmentoChip seg={tronco.seg} />
          </span>
        </button>
      )}
    </div>
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
