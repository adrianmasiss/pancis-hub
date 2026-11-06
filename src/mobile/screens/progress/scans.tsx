"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Paperclip } from "lucide-react";
import type {
  MeasurementView,
  PhotoViewItem,
} from "@/features/progress/queries";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import { useUnits } from "@/mobile/units";
import { fechaCorta, num } from "./format";
import { MeasurementPhotos, SegmentTable, filasDe } from "./scan-detail";

const FUENTE: Record<string, string> = {
  inbody: "InBody",
  bascula: "Báscula",
  manual: "Manual",
  onboarding: "Inicial",
  otro: "Medición",
};

/** «65,1 kg · 17,1 % grasa · 30,6 kg músculo», con lo que traiga. */
function resumen(m: MeasurementView, u: ReturnType<typeof useUnits>) {
  return [
    m.weightKg !== null && `${u.fmtWeight(m.weightKg)} ${u.weightUnit}`,
    m.bodyFatPercentage !== null && `${num(m.bodyFatPercentage)} % grasa`,
    m.skeletalMuscleKg !== null &&
      `${u.fmtWeight(m.skeletalMuscleKg)} ${u.weightUnit} músculo`,
    m.waistCm !== null && `cintura ${u.fmtLength(m.waistCm)} ${u.lengthUnit}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function hoyAnio() {
  return new Date().getFullYear();
}

/** La baldosa de la izquierda: el puntaje del InBody o la fuente. */
function Badge({ m, first }: { m: MeasurementView; first: boolean }) {
  return (
    <span
      className="m-prog-score m-num"
      data-first={first ? "" : undefined}
      data-text={m.inbodyScore === null ? "" : undefined}
      aria-label={
        m.inbodyScore !== null ? `Puntaje ${m.inbodyScore}` : FUENTE[m.source]
      }
    >
      {m.inbodyScore ?? FUENTE[m.source]?.slice(0, 3) ?? "—"}
    </span>
  );
}

/** Los ultimos tres escaneos en Resumen; «Ver todos» abre la pestaña. */
export function ScanHistory({
  measurements,
}: {
  measurements: MeasurementView[];
}) {
  const u = useUnits();
  const ultimos = measurements.slice(0, 3);
  if (ultimos.length === 0) return null;
  return (
    <section
      className="m-stack"
      style={{ gap: 8 }}
      aria-labelledby="m-prog-hist-t"
    >
      <div className="m-prog-section-head">
        <h2 id="m-prog-hist-t" className="m-eyebrow">
          Historial de escaneos
        </h2>
        {measurements.length > 3 && (
          <Link href="/progreso?vista=escaneos" className="m-prog-link">
            Ver todos
          </Link>
        )}
      </div>
      <div className="m-stack m-stagger" style={{ gap: 8 }}>
        {ultimos.map((m, i) => (
          <Link
            key={m.id}
            href={`/progreso?vista=escaneos&m=${m.id}`}
            className="m-list-row m-press"
          >
            <Badge m={m} first={i === 0} />
            <span className="m-list-row-main">
              <span className="m-list-row-title">
                {fechaCorta(m.measuredAt, true)}
              </span>
              <span className="m-list-row-sub m-num">{resumen(m, u)}</span>
            </span>
            <ChevronRight className="m-chevron" size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Escaneos: todas las mediciones, de la mas nueva a la mas vieja. Cada una
 * se despliega con todas sus cifras, su analisis por segmento y sus fotos
 * (el respaldo de esas cifras), y se puede editar ahi mismo.
 */
export function ScansList({
  measurements,
  photos,
  initialOpen,
}: {
  measurements: MeasurementView[];
  photos: PhotoViewItem[];
  /** La que se abrio desde el historial de Resumen (`?m=`). */
  initialOpen: string | null;
}) {
  const u = useUnits();
  const [abierta, setAbierta] = useState<string | null>(initialOpen);
  // La que llega abierta se trae a la vista una vez, al montar.
  useEffect(() => {
    if (initialOpen)
      document
        .getElementById(`m-${initialOpen}`)
        ?.scrollIntoView({ block: "center" });
  }, [initialOpen]);
  if (measurements.length === 0) {
    return (
      <div className="m-body">
        <section className="m-card m-rest-empty">
          <p className="m-sheet-text">
            Aún no hay escaneos. Toca «+» para importar tu InBody o anotar una
            medición.
          </p>
        </section>
      </div>
    );
  }
  return (
    <div className="m-body m-stagger">
      {measurements.map((m, i) => {
        const open = abierta === m.id;
        const anio =
          new Date(`${m.measuredAt}T12:00:00`).getFullYear() !== hoyAnio();
        return (
          <section
            key={m.id}
            id={`m-${m.id}`}
            className="m-card m-prog-scan"
            data-size="sm"
          >
            <button
              type="button"
              className="m-prog-scan-toggle m-press"
              aria-expanded={open}
              aria-controls={`m-scan-${m.id}`}
              onClick={() => setAbierta(open ? null : m.id)}
            >
              <Badge m={m} first={i === 0} />
              <span className="m-list-row-main">
                <span className="m-list-row-title">
                  {fechaCorta(m.measuredAt, anio)} · {FUENTE[m.source]}
                </span>
                <span className="m-list-row-sub m-num">{resumen(m, u)}</span>
              </span>
              <ChevronDown
                size={18}
                className="m-more-chevron"
                aria-hidden="true"
              />
            </button>
            <div className="m-more-panel" id={`m-scan-${m.id}`} inert={!open}>
              <div className="m-more-inner m-prog-scan-inner">
                <dl className="m-prog-facts">
                  {filasDe(m, u).map((f) => (
                    <div key={f.key}>
                      <dt>{f.label}</dt>
                      <dd className="m-num">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <SegmentTable m={m} />
                <MeasurementPhotos
                  measurement={m}
                  photos={photos}
                  measurements={measurements}
                />
                <div className="m-prog-scan-foot">
                  {m.hasAttachment && (
                    <span className="m-sub">
                      <Paperclip size={13} aria-hidden="true" /> Informe adjunto
                    </span>
                  )}
                  <MeasurementFormDialog measurement={m} />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
