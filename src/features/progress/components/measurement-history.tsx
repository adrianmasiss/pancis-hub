import { SinDato } from "@/components/shared/sin-dato";
import { PhotoTrio } from "./photo-trio";
import { MeasurementAttachmentButton } from "./measurement-attachment-button";
import type {
  MeasurementView,
  PhotoViewItem,
} from "@/features/progress/queries";

const FUENTES: Record<string, string> = {
  inbody: "InBody",
  bascula: "Báscula",
  manual: "Manual",
  onboarding: "Inicial",
  otro: "Otra",
};

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

const num = (valor: number | null, unidad: string, decimales = 1) =>
  valor == null
    ? null
    : `${valor.toLocaleString("es-419", { maximumFractionDigits: decimales })} ${unidad}`;

/**
 * El historial como fichas, no como tabla.
 *
 * Una tabla obliga a que toda medición tenga las mismas columnas, y aquí casi
 * ninguna las tiene: un pesaje trae un número y un InBody trae ocho. La ficha
 * muestra lo que esa medición SÍ registró y calla el resto, en vez de una
 * fila con seis guiones. Y sobre todo: deja sitio para las fotos de ese día,
 * que es lo que la tabla no podía dar.
 */
export function MeasurementHistory({
  measurements,
  photos,
}: {
  measurements: MeasurementView[];
  photos: PhotoViewItem[];
}) {
  const porMedicion = new Map<string, PhotoViewItem[]>();
  for (const foto of photos) {
    if (!foto.measurementId) continue;
    const lista = porMedicion.get(foto.measurementId) ?? [];
    lista.push(foto);
    porMedicion.set(foto.measurementId, lista);
  }

  return (
    <ol className="measurement-history">
      {measurements.map((m) => {
        const datos = [
          ["Peso", num(m.weightKg, "kg")],
          ["Grasa", num(m.bodyFatPercentage, "%")],
          ["Músculo", num(m.skeletalMuscleKg, "kg")],
          ["Cintura", num(m.waistCm, "cm")],
          ["Cadera", num(m.hipCm, "cm")],
          ["Pecho", num(m.chestCm, "cm")],
          ["Brazo", num(m.armCm, "cm")],
          ["Muslo", num(m.thighCm, "cm")],
          ["Visceral", num(m.visceralFatLevel, "", 0)],
          ["Agua", num(m.bodyWaterPercentage, "%")],
        ].filter(([, valor]) => valor !== null) as [string, string][];
        const fotos = porMedicion.get(m.id) ?? [];

        return (
          <li key={m.id} className="measurement-entry">
            <div className="measurement-entry-head">
              <div>
                <h3>{fecha(m.measuredAt)}</h3>
                <p>
                  <span className="measurement-source">
                    {FUENTES[m.source] ?? "Medición"}
                  </span>
                  {fotos.length > 0 ? (
                    <>
                      {" · "}
                      {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
                    </>
                  ) : null}
                </p>
              </div>
              {m.hasAttachment ? (
                <MeasurementAttachmentButton measurementId={m.id} />
              ) : null}
            </div>

            {datos.length > 0 ? (
              <dl className="measurement-entry-data">
                {datos.map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt>{rotulo}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="measurement-entry-empty">
                <SinDato /> — esta medición no registró ningún valor.
              </p>
            )}

            {m.notes ? (
              <p className="measurement-entry-note">{m.notes}</p>
            ) : null}

            {/* El trío sólo aparece si hay al menos una foto: en una medición
                sin fotos, tres huecos vacíos serían ruido en cada fila. */}
            {fotos.length > 0 ? <PhotoTrio photos={fotos} /> : null}
          </li>
        );
      })}
    </ol>
  );
}
