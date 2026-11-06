"use client";

import Link from "next/link";
import { useState } from "react";
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

export type Fila = { key: keyof MeasurementView; label: string; value: string };

/** Todas las cifras de una medicion que traiga, en el orden del informe. */
export function filasDe(m: MeasurementView, u: Units): Fila[] {
  const kg = (v: number) => `${u.fmtWeight(v)} ${u.weightUnit}`;
  const cm = (v: number) => `${u.fmtLength(v)} ${u.lengthUnit}`;
  const filas: [keyof MeasurementView, string, string | null][] = [
    ["weightKg", "Peso", m.weightKg !== null ? kg(m.weightKg) : null],
    [
      "bodyFatPercentage",
      "% de grasa",
      m.bodyFatPercentage !== null ? `${num(m.bodyFatPercentage)} %` : null,
    ],
    [
      "skeletalMuscleKg",
      "Masa muscular",
      m.skeletalMuscleKg !== null ? kg(m.skeletalMuscleKg) : null,
    ],
    [
      "visceralFatLevel",
      "Grasa visceral",
      m.visceralFatLevel !== null ? `Nivel ${num(m.visceralFatLevel)}` : null,
    ],
    [
      "totalBodyWaterL",
      "Agua corporal",
      m.totalBodyWaterL !== null
        ? `${num(m.totalBodyWaterL)} L`
        : m.bodyWaterPercentage !== null
          ? `${num(m.bodyWaterPercentage)} %`
          : null,
    ],
    ["proteinKg", "Proteína", m.proteinKg !== null ? kg(m.proteinKg) : null],
    ["mineralKg", "Minerales", m.mineralKg !== null ? kg(m.mineralKg) : null],
    [
      "basalMetabolicRateKcal",
      "Metabolismo basal",
      m.basalMetabolicRateKcal !== null
        ? `${num(m.basalMetabolicRateKcal, 0)} kcal`
        : null,
    ],
    ["bmi", "IMC", m.bmi !== null ? num(m.bmi) : null],
    [
      "waistHipRatio",
      "Cintura/cadera",
      m.waistHipRatio !== null ? num(m.waistHipRatio, 2) : null,
    ],
    ["waistCm", "Cintura", m.waistCm !== null ? cm(m.waistCm) : null],
    ["hipCm", "Cadera", m.hipCm !== null ? cm(m.hipCm) : null],
    ["chestCm", "Pecho", m.chestCm !== null ? cm(m.chestCm) : null],
    ["armCm", "Brazo", m.armCm !== null ? cm(m.armCm) : null],
    ["thighCm", "Muslo", m.thighCm !== null ? cm(m.thighCm) : null],
  ];
  return filas.flatMap(([key, label, value]) =>
    value === null ? [] : [{ key, label, value }],
  );
}

const SEGMENTO: Record<SegmentKey, string> = {
  brazo_derecho: "Brazo der.",
  brazo_izquierdo: "Brazo izq.",
  tronco: "Tronco",
  pierna_derecha: "Pierna der.",
  pierna_izquierda: "Pierna izq.",
};

/** El analisis por segmento entero: magra y grasa de cada parte. */
export function SegmentTable({ m }: { m: MeasurementView }) {
  const u = useUnits();
  const filas = m.segments.filter(
    (s) => s.leanMassKg !== null || s.fatMassKg !== null,
  );
  if (filas.length === 0) return null;
  const kg = (v: number | null) => (v === null ? "—" : u.fmtWeight(v));
  return (
    <table className="m-prog-seg-table m-num">
      <thead>
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
            <td>
              {kg(s.leanMassKg)}
              <small>{u.weightUnit}</small>
            </td>
            <td>
              {kg(s.fatMassKg)}
              <small>{u.weightUnit}</small>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
 * «Más del escaneo», bajo las cuatro tarjetas en Resumen: plegado, para que
 * lo principal quepa en una mirada. Dentro, lo que no se ve arriba, el
 * analisis por segmento y las fotos de ese dia.
 */
export function ScanExtras({
  measurement,
  photos,
  measurements,
  omit,
}: {
  measurement: MeasurementView;
  photos: PhotoViewItem[];
  measurements: MeasurementView[];
  /** Lo que ya se ve junto al maniqui. */
  omit: (keyof MeasurementView)[];
}) {
  const u = useUnits();
  const [open, setOpen] = useState(false);
  const filas = filasDe(measurement, u).filter((f) => !omit.includes(f.key));
  const fotos = photos.filter(
    (p) => p.measurementId === measurement.id && p.signedUrl,
  ).length;
  const conSegmentos = measurement.segments.some(
    (s) => s.leanMassKg !== null || s.fatMassKg !== null,
  );
  const pista = [
    filas
      .slice(0, 3)
      .map((f) => f.label)
      .join(", "),
    conSegmentos && "segmentos",
    fotos > 0 ? `${fotos} ${fotos === 1 ? "foto" : "fotos"}` : "fotos",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section className="m-card m-prog-extras m-prog-scan">
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
        <ChevronDown size={18} className="m-more-chevron" aria-hidden="true" />
      </button>
      <div className="m-more-panel" id="m-prog-extras" inert={!open}>
        <div className="m-more-inner m-prog-scan-inner">
          {filas.length > 0 && (
            <dl className="m-prog-facts">
              {filas.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd className="m-num">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <SegmentTable m={measurement} />
          <div className="m-prog-extras-photos">
            <span className="m-prog-sublabel">Fotos de ese día</span>
            <MeasurementPhotos
              measurement={measurement}
              photos={photos}
              measurements={measurements}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
