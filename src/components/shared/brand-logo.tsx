import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Alto de la caja del logotipo en px. */
  height?: number;
  className?: string;
};

/**
 * Wordmark a una sola tinta.
 *
 * El logotipo anterior era un PNG con degradado de varios colores y una bajada
 * de menos de 6 px que no se leia en ningun tamano. En un sistema donde el
 * color ES la magnitud, la marca era la mayor fuga: cuatro tintas compitiendo
 * con los discos en todas las pantallas.
 *
 * Ahora se compone con la voz de la cifra —la misma Archivo Black troquelada—
 * en `currentColor`, asi que es acero sobre tiza y tiza sobre goma sin
 * mantener dos archivos. Los PNG originales siguen en `public/` por si se
 * quiere volver atras.
 */
export function BrandLogo({ height = 36, className }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "font-stamp inline-flex items-center leading-none whitespace-nowrap",
        className,
      )}
      style={{
        height,
        // La caja la fija `height`; el ojo tipografico va algo por debajo para
        // que el wordmark no toque los bordes de su bloque.
        fontSize: height * 0.62,
        letterSpacing: "-0.03em",
      }}
    >
      {messages.app.name}
    </span>
  );
}
