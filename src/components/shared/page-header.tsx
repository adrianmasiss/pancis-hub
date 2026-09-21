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
  /**
   * Contexto de la pantalla, bajo el titulo: el selector de fecha en
   * Nutricion, por ejemplo. Va aqui y no como una fila suelta debajo porque
   * es parte de "donde estoy", no del contenido.
   */
  children?: React.ReactNode;
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
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "grid h-[153px] grid-cols-[minmax(0,1fr)_auto] content-end items-start gap-x-3 gap-y-4 pb-4 lg:mb-7 lg:h-[84px] lg:content-center lg:gap-y-0 lg:pb-0",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
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
          <h1 className="page-display min-w-0 truncate">{title}</h1>
        </div>
        {description ? (
          <p className="text-muted-foreground max-w-[58ch] text-[0.9375rem] leading-[1.65]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:row-span-2 lg:self-center">
          {actions}
        </div>
      ) : null}

      {children ? (
        <div className="col-span-2 min-w-0 lg:col-span-1 lg:col-start-1 lg:row-start-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
