import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Etiqueta corta de seccion, en versalitas, encima del titulo. */
  eyebrow?: string;
  /**
   * Icono identitario de la seccion. Se dibuja al filo del texto, sin chip de
   * color: la barra superior y el riel ya identifican donde estas.
   */
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Encabezado de pagina. No es una superficie: es tipografia sobre el fondo,
 * cerrada por un filete. Asi el primer bloque de contenido real sube y no se
 * pierde media pantalla en presentacion.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-hairline flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? <p className="label-micro">{eyebrow}</p> : null}
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <Icon
              className="text-muted-foreground size-5 shrink-0"
              aria-hidden="true"
            />
          ) : null}
          {/* Escala editorial: el titulo es la pieza que fija el tono de la
              pagina, no una etiqueta mas de la barra. */}
          <h1 className="min-w-0 truncate text-[1.75rem] font-medium tracking-[-0.03em] sm:display-title">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="text-muted-foreground max-w-[62ch] text-[0.8125rem] leading-relaxed sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
