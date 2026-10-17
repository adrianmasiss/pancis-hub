import { cn } from "@/lib/utils";

type ViewHeaderProps = {
  /** El nombre de la pantalla. Visible, no para lectores de pantalla. */
  title: string;
  /**
   * La linea de contexto bajo el titulo: la fecha en Hoy, las comidas del
   * plan en Nutricion, el dia de la rutina en Entrenamiento. Es "donde
   * estoy", no contenido. Va en versalitas monoespaciadas, como en Hoy.
   */
  meta?: string;
  /** Entradilla de la pantalla, en prosa, bajo la linea de contexto. */
  description?: string;
  /** Acciones de pantalla, alineadas a la derecha del titulo. */
  actions?: React.ReactNode;
  /** Piezas que pertenecen al encabezado, como un selector de fecha. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * El encabezado de pantalla, uno para todas.
 *
 * Sale de Hoy: titulo de 30px semibold sobre la linea de contexto en
 * versalitas monoespaciadas. El usuario lo aprobo ahi —"esto es algo que
 * queda"— y pidio que el resto de las pantallas se vieran igual.
 *
 * Sustituye a las dos formas que convivian. Una, el `<h1 className="sr-only">`
 * con un `label-micro` suelto debajo (Nutricion, Progreso, Entrenamiento),
 * que dejaba las pantallas SIN titulo visible. Otra, el antiguo `PageHeader`,
 * una banda de 153px en telefono y 84px en escritorio con el titulo en
 * `page-display`, un icono al filo y un `content-end` que empujaba el
 * contenido: gastaba el primer pliegue en presentarse. El icono no vuelve —el
 * riel y la barra superior ya dicen donde estas, que era el motivo
 * documentado para no darle un chip de color.
 *
 * No es una superficie: es tipografia sobre el escenario, sin filete ni chip.
 */
export function ViewHeader({
  title,
  meta,
  description,
  actions,
  children,
  className,
}: ViewHeaderProps) {
  return (
    <header
      className={cn(
        "view-header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {meta ? (
          <p className="label-micro text-subtle-foreground font-mono">{meta}</p>
        ) : null}
        {description ? (
          <p className="text-muted-foreground max-w-[58ch] text-[0.9375rem] leading-[1.65]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}

      {children ? <div className="col-span-2 min-w-0">{children}</div> : null}
    </header>
  );
}
