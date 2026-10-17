import { PhotoTrio } from "./photo-trio";
import type { PhotoViewItem } from "@/features/progress/queries";

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

/**
 * Todas las fotos, agrupadas por día y de la más reciente a la más antigua.
 *
 * Agrupar por fecha y no por vista es lo que permite la lectura que importa:
 * bajar la página y ver cómo cambia el mismo encuadre sesión a sesión. Una
 * cuadrícula plana de miniaturas mezcladas no deja comparar nada.
 */
export function PhotoGallery({ photos }: { photos: PhotoViewItem[] }) {
  const porFecha = new Map<string, PhotoViewItem[]>();
  for (const foto of photos) {
    const lista = porFecha.get(foto.capturedAt) ?? [];
    lista.push(foto);
    porFecha.set(foto.capturedAt, lista);
  }
  const dias = [...porFecha.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <ol className="photo-gallery">
      {dias.map(([dia, fotos]) => (
        <li key={dia}>
          <div className="photo-gallery-head">
            <h3>{fecha(dia)}</h3>
            <span>
              {fotos.length} de 3{" "}
              {fotos.some((f) => f.measurementId)
                ? "· con medición"
                : "· suelta"}
            </span>
          </div>
          <PhotoTrio photos={fotos} size="lg" />
          {fotos.find((f) => f.notes)?.notes ? (
            <p className="photo-gallery-note">
              {fotos.find((f) => f.notes)?.notes}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
