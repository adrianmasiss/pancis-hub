import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";

type AuthFormHeaderProps = {
  title: string;
  description: string;
};

/**
 * Cabecera de la columna del formulario: marca y proposito de la pantalla.
 *
 * El isotipo vive aqui y no sobre la tarjeta porque la tarjeta ya no es una
 * sola columna: un logotipo centrado encima partiria en dos el panel que se
 * desplaza. Solo el isotipo, con el nombre reconstruido con tipografia viva,
 * como manda el sistema a escalas pequenas (el PNG completo trae un subtitulo
 * que a este tamano es ruido).
 */
export function AuthFormHeader({ title, description }: AuthFormHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex items-center gap-2.5">
        <BrandLogo variant="mark" height={30} />
        <span className="text-[15px] font-semibold tracking-[-0.02em]">
          {messages.app.name}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="page-display text-balance">{title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
          {description}
        </p>
      </div>
    </div>
  );
}
