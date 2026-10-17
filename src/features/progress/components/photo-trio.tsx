import { Camera } from "lucide-react";
import type { PhotoViewItem } from "@/features/progress/queries";
import { PHOTO_VIEWS, type PhotoView } from "@/features/progress/schemas";

const ROTULOS: Record<PhotoView, string> = {
  frontal: "Frontal",
  lateral: "Lateral",
  posterior: "Posterior",
};

/**
 * Las tres vistas de una medición, siempre las tres.
 *
 * El hueco de la foto que falta NO se esconde: se dibuja apagado con su
 * rótulo. Una rejilla que sólo muestra lo que hay no deja ver que falta la
 * lateral, y ver el hueco es lo que recuerda tomarla la próxima vez. El
 * modelo ya sólo admite estas tres (`view_type`), así que el trío no es una
 * convención de esta vista: es el esquema.
 */
export function PhotoTrio({
  photos,
  size = "sm",
}: {
  photos: PhotoViewItem[];
  size?: "sm" | "lg";
}) {
  const porVista = new Map(photos.map((foto) => [foto.viewType, foto]));

  return (
    <ul className="photo-trio" data-size={size}>
      {PHOTO_VIEWS.map((vista) => {
        const foto = porVista.get(vista);
        return (
          <li key={vista} data-missing={foto ? undefined : ""}>
            {foto?.signedUrl ? (
              /* `<img>` y no `next/image`: la fuente es una URL firmada de
                 diez minutos y única por carga, así que el optimizador no
                 puede cachear nada y sólo añade una capa que puede fallar.
                 Es lo que ya hacía `PhotosSection`. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto.signedUrl}
                alt={`Foto ${ROTULOS[vista].toLowerCase()}`}
                className="photo-trio-img"
              />
            ) : (
              <span className="photo-trio-empty" aria-hidden="true">
                <Camera size={size === "lg" ? 22 : 15} strokeWidth={1.5} />
              </span>
            )}
            <span className="photo-trio-label">{ROTULOS[vista]}</span>
          </li>
        );
      })}
    </ul>
  );
}
