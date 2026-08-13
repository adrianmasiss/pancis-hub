import { Skeleton } from "@/components/ui/skeleton";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

/**
 * Piezas de carga.
 *
 * Un esqueleto solo sirve si reserva la misma geometria que el contenido al
 * que sustituye: mismas alturas, mismas columnas, mismo filete. Si no, la
 * llegada de los datos empuja el layout (CLS) y el usuario percibe un
 * parpadeo en vez de una espera. Por eso estas piezas copian las medidas de
 * PageHeader, Card y MetricCard en lugar de apilar rectangulos genericos.
 */

/** Envoltorio accesible comun. Anuncia la espera una sola vez por region. */
export function LoadingShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={messages.common.loading}
      className={cn("space-y-6", className)}
    >
      {children}
      <span className="sr-only">{messages.common.loading}</span>
    </div>
  );
}

/**
 * Reserva de PageHeader.
 *
 * `icon` y `description` siguen en true por defecto porque las pantallas sin
 * migrar los pasan; las que ya estan en el sistema P7 los apagan, y si el
 * esqueleto no lo hiciera reservaria dos lineas que nunca llegan.
 */
export function SkeletonPageHeader({
  actions = 2,
  icon = true,
  description = true,
  /** Fila extra bajo el titulo (el selector de fecha de Nutricion). */
  subline = false,
}: {
  actions?: number;
  icon?: boolean;
  description?: boolean;
  subline?: boolean;
}) {
  return (
    <div className="border-hairline flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2.5">
          {icon ? <Skeleton className="size-5 shrink-0 rounded-sm" /> : null}
          <Skeleton className="h-6 w-44 sm:h-7" />
        </div>
        {description ? (
          <Skeleton className="h-4 w-full max-w-[42ch]" />
        ) : null}
        {subline ? <Skeleton className="h-9 w-64 rounded-full" /> : null}
      </div>
      {actions > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-10 w-32 rounded-lg" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Reserva de Card: filete, titulo opcional y cuerpo de alto declarado. */
export function SkeletonCard({
  title = true,
  bodyClassName = "h-24",
  className,
  children,
}: {
  title?: boolean;
  bodyClassName?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    /* `surface-card`, como la tarjeta real: reservaba un filete sobre el
       fondo, y la tarjeta de este sistema es una superficie elevada sin
       borde. El esqueleto dibujaba una caja que luego no aparecia. */
    <div className={cn("surface-card px-5 py-5", className)}>
      {title ? <Skeleton className="mb-4 h-5 w-32" /> : null}
      {children ?? (
        <Skeleton className={cn("w-full rounded-lg", bodyClassName)} />
      )}
    </div>
  );
}

/**
 * Reserva de la fila de MetricCard: etiqueta corta sobre cifra.
 * Las clases de columna se escriben completas porque Tailwind lee el fuente y
 * no resuelve nombres construidos en tiempo de ejecucion.
 */
export function SkeletonMetricRow({ count = 3 }: { count?: 2 | 3 | 4 }) {
  const columns =
    count === 2 ? "grid-cols-2" : count === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Reserva de grafica. Alto fijo: es lo que mas desplaza el layout al llegar. */
export function SkeletonChart({ className }: { className?: string }) {
  return <Skeleton className={cn("h-52 w-full rounded-lg", className)} />;
}

/** Reserva de lista de filas separadas por filete. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="border-hairline divide-hairline divide-y rounded-xl border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}

type LoadingSectionProps = {
  /** Cantidad de tarjetas simuladas bajo el encabezado. */
  rows?: number;
  className?: string;
};

/**
 * Carga generica: encabezado de pagina mas tarjetas apiladas. Es la forma que
 * comparten casi todas las rutas de (app); las que se desvian traen su propio
 * loading.tsx.
 */
export function LoadingSection({ rows = 3, className }: LoadingSectionProps) {
  return (
    <LoadingShell className={className}>
      <SkeletonPageHeader />
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </LoadingShell>
  );
}
