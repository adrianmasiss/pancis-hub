"use client";

import { useMemo, useState } from "react";
import { ChevronsLeftRight, PersonStanding } from "lucide-react";
import type {
  MeasurementView,
  PhotoViewItem,
} from "@/features/progress/queries";
import { PhotoUploadDialog } from "@/features/progress/components/photo-upload-dialog";

const POSES = [
  { id: "frontal", label: "Frente" },
  { id: "lateral", label: "Lado" },
  { id: "posterior", label: "Espalda" },
] as const;

const corta = (iso: string) =>
  new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(iso))
    .replace(".", "");

/**
 * Fotos de progreso por pose. La mas reciente contra la fecha que
 * se elija, con un deslizador que descubre una sobre la otra. Las fotos son
 * privadas: se sirven con URL firmada y solo las ve su dueño.
 */
export function ProgressEvidence({
  photos,
  measurements,
}: {
  photos: PhotoViewItem[];
  measurements: MeasurementView[];
}) {
  const [pose, setPose] = useState<(typeof POSES)[number]["id"]>("frontal");
  const deLaPose = useMemo(
    () =>
      photos
        .filter((p) => p.viewType === pose && p.signedUrl)
        .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    [photos, pose],
  );
  const reciente = deLaPose[0] ?? null;
  const anteriores = deLaPose.slice(1);
  const [comparaId, setComparaId] = useState<string | null>(null);
  const compara =
    anteriores.find((p) => p.id === comparaId) ?? anteriores.at(-1) ?? null;
  const [corte, setCorte] = useState(50);

  return (
    <div className="m-body m-stagger">
      <div className="m-grid-3">
        {POSES.map((p) => (
          <button
            key={p.id}
            type="button"
            className="m-filter m-press"
            style={{ justifyContent: "center" }}
            aria-current={p.id === pose ? "page" : undefined}
            onClick={() => {
              setPose(p.id);
              setComparaId(null);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className="m-compare-photo"
        style={{ ["--corte" as string]: `${corte}%` }}
      >
        {reciente ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase */}
            <img
              src={compara?.signedUrl ?? reciente.signedUrl!}
              alt={
                compara
                  ? `${POSES.find((x) => x.id === pose)!.label}, ${corta(compara.capturedAt)}`
                  : ""
              }
            />
            {compara && (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase
              <img
                src={reciente.signedUrl!}
                alt={`${POSES.find((x) => x.id === pose)!.label}, ${corta(reciente.capturedAt)}`}
                className="m-compare-top"
              />
            )}
            <span className="m-chip m-compare-tag" style={{ left: 12 }}>
              {corta(reciente.capturedAt)}
            </span>
            {compara && (
              <>
                <span className="m-chip m-compare-tag" style={{ right: 12 }}>
                  {corta(compara.capturedAt)}
                </span>
                <span className="m-compare-handle" aria-hidden="true">
                  <ChevronsLeftRight size={18} />
                </span>
              </>
            )}
          </>
        ) : (
          <div className="m-compare-empty">
            <PersonStanding size={56} strokeWidth={1.2} aria-hidden="true" />
            <span>
              Aún no hay fotos de{" "}
              {POSES.find((x) => x.id === pose)!.label.toLowerCase()}.
            </span>
          </div>
        )}
      </div>

      {compara && (
        <label className="m-row m-slider">
          <span className="m-sub">Desliza</span>
          <input
            type="range"
            min={0}
            max={100}
            value={corte}
            onChange={(e) => setCorte(Number(e.target.value))}
            aria-label="Comparar antes y después"
          />
        </label>
      )}

      {anteriores.length > 0 && (
        <section className="m-stack">
          <h2 className="m-section" style={{ fontSize: 15 }}>
            Comparar con
          </h2>
          <div className="m-chips-scroll">
            {anteriores.map((p) => (
              <button
                key={p.id}
                type="button"
                className="m-date-chip m-press"
                aria-pressed={p.id === compara?.id}
                onClick={() => setComparaId(p.id)}
              >
                {corta(p.capturedAt)}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="m-legacy-cta">
        <PhotoUploadDialog
          measurements={measurements.map((m) => ({
            id: m.id,
            measuredAt: m.measuredAt,
          }))}
        />
      </div>
    </div>
  );
}
