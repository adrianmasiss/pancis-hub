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
 * ViewHeader, Card y MetricCard en lugar de apilar rectangulos genericos.
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
      {/* Sin puntos arriba. Quien cuenta la espera al cambiar de seccion es la
          cortina de marca (`NavLoadingScreen`); repetirla aqui daba dos avisos
          de lo mismo, uno encima del otro. Lo que queda es el esqueleto, que
          no anuncia la espera: reserva la geometria de lo que va a llegar.
          El aviso para un lector de pantalla sigue siendo `role="status"` con
          el texto de abajo. */}
      {children}
      <span className="sr-only">{messages.common.loading}</span>
    </div>
  );
}

/**
 * Reserva de ViewHeader.
 *
 * Sigue al encabezado nuevo: titulo de 30px, linea de contexto en versalitas
 * y entradilla opcional, sin icono y sin filete. El icono salio del
 * encabezado, asi que tampoco se reserva.
 */
export function SkeletonViewHeader({
  actions = 2,
  meta = true,
  description = false,
  /** Fila extra bajo el titulo (el selector de fecha de Nutricion). */
  subline = false,
}: {
  actions?: number;
  meta?: boolean;
  description?: boolean;
  subline?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col gap-2">
        <Skeleton className="h-9 w-44" />
        {meta ? <Skeleton className="h-3 w-32" /> : null}
        {description ? <Skeleton className="h-4 w-full max-w-[42ch]" /> : null}
      </div>
      {actions > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-10 w-32 rounded-lg" />
          ))}
        </div>
      ) : null}
      {subline ? (
        <Skeleton className="col-span-2 h-9 w-64 rounded-full" />
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
 * Reserva de la fila de MetricCard: cifra y, debajo, su etiqueta.
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
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
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
        <div
          key={index}
          className="flex items-center justify-between gap-4 p-4"
        >
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
      <SkeletonViewHeader />
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </LoadingShell>
  );
}
