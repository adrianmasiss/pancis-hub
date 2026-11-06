"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown, ImagePlus } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import type {
  MeasurementView,
  PhotoViewItem,
  SegmentKey,
} from "@/features/progress/queries";
import { PhotoUploadDialog } from "@/features/progress/components/photo-upload-dialog";
import { useUnits } from "@/mobile/units";
import { num } from "./format";

type Units = ReturnType<typeof useUnits>;

export type Fila = {
  key: keyof MeasurementView;
  label: string;
  value: string;
  unit: string;
};

/** Todas las cifras de una medicion que traiga, en el orden del informe. */
export function filasDe(m: MeasurementView, u: Units): Fila[] {
  const kg = (v: number) => [u.fmtWeight(v), u.weightUnit] as const;
  const cm = (v: number) => [u.fmtLength(v), u.lengthUnit] as const;
  const filas: [
    keyof MeasurementView,
    string,
    readonly [string, string] | null,
  ][] = [
    ["weightKg", "Peso", m.weightKg !== null ? kg(m.weightKg) : null],
    [
      "bodyFatPercentage",
      "% de grasa",
      m.bodyFatPercentage !== null ? [num(m.bodyFatPercentage), "%"] : null,
    ],
    [
      "skeletalMuscleKg",
      "Masa muscular",
      m.skeletalMuscleKg !== null ? kg(m.skeletalMuscleKg) : null,
    ],
    [
      "totalBodyWaterL",
      "Agua corporal",
      m.totalBodyWaterL !== null
        ? [num(m.totalBodyWaterL), "L"]
        : m.bodyWaterPercentage !== null
          ? [num(m.bodyWaterPercentage), "%"]
          : null,
    ],
    ["proteinKg", "Proteína", m.proteinKg !== null ? kg(m.proteinKg) : null],
    ["mineralKg", "Minerales", m.mineralKg !== null ? kg(m.mineralKg) : null],
    [
      "visceralFatLevel",
      "Grasa visceral",
      m.visceralFatLevel !== null
        ? [`Nivel ${num(m.visceralFatLevel)}`, ""]
        : null,
    ],
    [
      "basalMetabolicRateKcal",
      "Metabolismo basal",
      m.basalMetabolicRateKcal !== null
        ? [num(m.basalMetabolicRateKcal, 0), "kcal"]
        : null,
    ],
    ["bmi", "IMC", m.bmi !== null ? [num(m.bmi), ""] : null],
    [
      "waistHipRatio",
      "Cintura/cadera",
      m.waistHipRatio !== null ? [num(m.waistHipRatio, 2), ""] : null,
    ],
    ["waistCm", "Cintura", m.waistCm !== null ? cm(m.waistCm) : null],
    ["hipCm", "Cadera", m.hipCm !== null ? cm(m.hipCm) : null],
    ["chestCm", "Pecho", m.chestCm !== null ? cm(m.chestCm) : null],
    ["armCm", "Brazo", m.armCm !== null ? cm(m.armCm) : null],
    ["thighCm", "Muslo", m.thighCm !== null ? cm(m.thighCm) : null],
  ];
  return filas.flatMap(([key, label, v]) =>
    v === null ? [] : [{ key, label, value: v[0], unit: v[1] }],
  );
}

/** Las cifras por tema, en el orden en que se leen. */
const GRUPOS: { titulo: string; keys: (keyof MeasurementView)[] }[] = [
  {
    titulo: "Principal",
    keys: ["weightKg", "bodyFatPercentage", "skeletalMuscleKg"],
  },
  {
    titulo: "Composición",
    keys: ["totalBodyWaterL", "proteinKg", "mineralKg"],
  },
  {
    titulo: "Metabolismo",
    keys: [
      "visceralFatLevel",
      "basalMetabolicRateKcal",
      "bmi",
      "waistHipRatio",
    ],
  },
  {
    titulo: "Medidas",
    keys: ["waistCm", "hipCm", "chestCm", "armCm", "thighCm"],
  },
];

/** Una bandeja: rotulo pequeño encima y filas de rotulo y cifra dentro. */
function Bandeja({
  titulo,
  extra,
  children,
}: {
  titulo: string;
  extra?: string;
  children: ReactNode;
}) {
  return (
    <section className="m-prog-tray">
      <h3 className="m-prog-tray-title">
        {titulo}
        {extra && <span>{extra}</span>}
      </h3>
      <div className="m-prog-tray-core">{children}</div>
    </section>
  );
}

/** Las cifras de un escaneo agrupadas en bandejas. */
export function ScanFacts({
  m,
  omit = [],
}: {
  m: MeasurementView;
  omit?: (keyof MeasurementView)[];
}) {
  const u = useUnits();
  const filas = filasDe(m, u).filter((f) => !omit.includes(f.key));
  return GRUPOS.map((g) => {
    const suyas = g.keys.flatMap((k) => filas.filter((f) => f.key === k));
    if (suyas.length === 0) return null;
    return (
      <Bandeja key={g.titulo} titulo={g.titulo}>
        <dl className="m-prog-tray-list">
          {suyas.map((f) => (
            <div key={f.key}>
              <dt>{f.label}</dt>
              <dd className="m-num">
                {f.value}
                {f.unit && <small>{f.unit}</small>}
              </dd>
            </div>
          ))}
        </dl>
      </Bandeja>
    );
  });
}

const SEGMENTO: Record<SegmentKey, string> = {
  brazo_derecho: "Brazo der.",
  brazo_izquierdo: "Brazo izq.",
  tronco: "Tronco",
  pierna_derecha: "Pierna der.",
  pierna_izquierda: "Pierna izq.",
};
const ORDEN_SEGMENTOS = Object.keys(SEGMENTO) as SegmentKey[];

/** El analisis por segmento entero: magra y grasa de cada parte, cada par
 * derecha/izquierda junto. */
export function SegmentTable({ m }: { m: MeasurementView }) {
  const u = useUnits();
  const filas = m.segments
    .filter((s) => s.leanMassKg !== null || s.fatMassKg !== null)
    .sort(
      (a, b) =>
        ORDEN_SEGMENTOS.indexOf(a.segment) - ORDEN_SEGMENTOS.indexOf(b.segment),
    );
  if (filas.length === 0) return null;
  const kg = (v: number | null) => (v === null ? "—" : u.fmtWeight(v));
  return (
    <Bandeja titulo="Por segmento" extra={`Magra · Grasa (${u.weightUnit})`}>
      <table className="m-prog-seg-table">
        <thead className="sr-only">
          <tr>
            <th scope="col">Segmento</th>
            <th scope="col">Magra</th>
            <th scope="col">Grasa</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((s) => (
            <tr key={s.segment}>
              <th scope="row">{SEGMENTO[s.segment]}</th>
              <td className="m-num">{kg(s.leanMassKg)}</td>
              <td className="m-num">{kg(s.fatMassKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Bandeja>
  );
}

/** Todo un escaneo: cifras por tema, segmentos y las fotos de ese dia. */
export function ScanDetail({
  measurement,
  photos,
  measurements,
  omit,
}: {
  measurement: MeasurementView;
  photos: PhotoViewItem[];
  measurements: MeasurementView[];
  omit?: (keyof MeasurementView)[];
}) {
  return (
    <>
      <ScanFacts m={measurement} omit={omit} />
      <SegmentTable m={measurement} />
      <Bandeja titulo="Fotos de ese día">
        <MeasurementPhotos
          measurement={measurement}
          photos={photos}
          measurements={measurements}
        />
      </Bandeja>
    </>
  );
}

const POSE: Record<string, string> = {
  frontal: "Frente",
  lateral: "Lado",
  posterior: "Espalda",
};

/**
 * Las fotos de esa medicion, como respaldo de sus cifras, y el boton para
 * sumar otra ya colgada de ella.
 */
export function MeasurementPhotos({
  measurement,
  photos,
  measurements,
}: {
  measurement: MeasurementView;
  photos: PhotoViewItem[];
  measurements: MeasurementView[];
}) {
  const [abierto, setAbierto] = useState(false);
  const suyas = photos.filter(
    (p) => p.measurementId === measurement.id && p.signedUrl,
  );
  return (
    <div className="m-prog-photos">
      {suyas.map((p) => (
        <Link
          key={p.id}
          href="/progreso?vista=fotos"
          className="m-prog-photo m-press"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase */}
          <img
            src={p.signedUrl!}
            alt={`${POSE[p.viewType] ?? "Foto"} de ese día`}
          />
          <span>{POSE[p.viewType] ?? "Foto"}</span>
        </Link>
      ))}
      <button
        type="button"
        className="m-prog-photo m-prog-photo-add m-press"
        onClick={() => setAbierto(true)}
      >
        <ImagePlus size={18} aria-hidden="true" />
        <span>{suyas.length ? "Otra foto" : "Agregar foto"}</span>
      </button>
      <PhotoUploadDialog
        open={abierto}
        onOpenChange={setAbierto}
        defaultMeasurementId={measurement.id}
        measurements={measurements.map((m) => ({
          id: m.id,
          measuredAt: m.measuredAt,
        }))}
      />
    </div>
  );
}

/**
 * «Más del escaneo», bajo el cuerpo en Resumen: plegado, para que lo
 * principal quepa en una mirada. Dentro, lo que no se ve arriba, el analisis
 * por segmento y las fotos de ese dia.
 */
export function ScanExtras({
  measurement,
  photos,
  measurements,
  omit,
  open,
  onOpenChange: setOpen,
}: {
  measurement: MeasurementView;
  photos: PhotoViewItem[];
  measurements: MeasurementView[];
  /** Lo que ya se ve junto al maniqui. */
  omit: (keyof MeasurementView)[];
  /** Controlado: «Ver todo el escaneo» lo abre desde la tarjeta del cuerpo. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const u = useUnits();
  const datos = filasDe(measurement, u).filter(
    (f) => !omit.includes(f.key),
  ).length;
  const fotos = photos.filter(
    (p) => p.measurementId === measurement.id && p.signedUrl,
  ).length;
  const segmentos = measurement.segments.filter(
    (s) => s.leanMassKg !== null || s.fatMassKg !== null,
  ).length;
  const pista = [
    datos > 0 && `${datos} ${datos === 1 ? "dato" : "datos"}`,
    segmentos > 0 && `${segmentos} segmentos`,
    fotos > 0 ? `${fotos} ${fotos === 1 ? "foto" : "fotos"}` : "sin fotos",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section
      id="m-prog-extras-card"
      className="m-card m-prog-extras m-prog-scan"
    >
      <button
        type="button"
        className="m-prog-scan-toggle m-press"
        aria-expanded={open}
        aria-controls="m-prog-extras"
        onClick={() => {
          triggerHaptic("selection");
          setOpen(!open);
        }}
      >
        <span className="m-list-row-main">
          <span className="m-list-row-title">Más del escaneo</span>
          <span className="m-list-row-sub">{pista}</span>
        </span>
        <span className="m-prog-chev" aria-hidden="true">
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="m-more-chevron"
          />
        </span>
      </button>
      <div className="m-more-panel" id="m-prog-extras" inert={!open}>
        <div className="m-more-inner m-prog-scan-inner">
          <ScanDetail
            measurement={measurement}
            photos={photos}
            measurements={measurements}
            omit={omit}
          />
        </div>
      </div>
    </section>
  );
}
