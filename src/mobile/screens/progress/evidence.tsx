"use client";

import { useMemo, useState } from "react";
import { ChevronsLeftRight, PersonStanding } from "lucide-react";
import type {
  MeasurementView,
  PhotoViewItem,
} from "@/features/progress/queries";
import { useUnits } from "@/mobile/units";
import { num, signo } from "./format";

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
 * privadas: se sirven con URL firmada y solo las ve su dueño. Debajo, el
 * respaldo: con que peso, grasa y musculo se tomo cada una (la medicion de
 * la que cuelga).
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

      {reciente && (
        <PhotoBacking
          reciente={reciente}
          compara={compara}
          measurements={measurements}
        />
      )}

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
    </div>
  );
}

const CIFRAS = [
  { key: "weightKg", label: "Peso", kg: true },
  { key: "bodyFatPercentage", label: "Grasa", kg: false },
  { key: "skeletalMuscleKg", label: "Músculo", kg: true },
] as const;

/**
 * Las cifras de la medicion de cada foto, lado a lado: «esta foto es con
 * 65,1 kg y 17,1 % de grasa». Sin medicion enlazada, lo dice.
 */
function PhotoBacking({
  reciente,
  compara,
  measurements,
}: {
  reciente: PhotoViewItem;
  compara: PhotoViewItem | null;
  measurements: MeasurementView[];
}) {
  const u = useUnits();
  const de = (p: PhotoViewItem | null) =>
    p?.measurementId
      ? (measurements.find((m) => m.id === p.measurementId) ?? null)
      : null;
  const nueva = de(reciente);
  const vieja = compara ? de(compara) : null;
  if (!nueva && !vieja) {
    return (
      <p className="m-sub m-prog-backing-none">
        {compara ? "Estas fotos no están" : "Esta foto no está"} ligada
        {compara ? "s" : ""} a una medición. Al subirlas desde «+», elige la
        medición de ese día.
      </p>
    );
  }
  const valor = (m: MeasurementView | null, c: (typeof CIFRAS)[number]) => {
    const v = m?.[c.key] ?? null;
    if (v === null) return "—";
    return c.kg ? `${u.fmtWeight(v)} ${u.weightUnit}` : `${num(v)} %`;
  };
  return (
    <section
      className="m-card m-prog-backing"
      data-size="sm"
      aria-label="Cifras de cada foto"
    >
      <table className="m-num">
        <thead>
          <tr>
            <td />
            {compara && <th scope="col">{corta(compara.capturedAt)}</th>}
            <th scope="col">{corta(reciente.capturedAt)}</th>
            {compara && <th scope="col">Cambio</th>}
          </tr>
        </thead>
        <tbody>
          {CIFRAS.map((c) => {
            const a = vieja?.[c.key] ?? null;
            const b = nueva?.[c.key] ?? null;
            const delta = a !== null && b !== null ? b - a : null;
            return (
              <tr key={c.key}>
                <th scope="row">{c.label}</th>
                {compara && <td>{valor(vieja, c)}</td>}
                <td>{valor(nueva, c)}</td>
                {compara && (
                  <td className="m-prog-backing-delta">
                    {delta === null
                      ? "—"
                      : c.kg
                        ? `${signo(u.weight(delta))} ${u.weightUnit}`
                        : `${signo(delta)} %`}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
