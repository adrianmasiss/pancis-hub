import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingShell,
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/shared/loading-section";

/**
 * Nutricion: encabezado con el selector de fecha dentro, resumen del dia, el
 * panel de "¿y si lo cambio?" y la pila de tarjetas de comida.
 *
 * El selector de fecha ya no es una fila suelta debajo del encabezado: subio
 * a la cabecera, y el esqueleto lo reserva ahi. Cuando estaba en los dos
 * sitios el resumen daba un salto al hidratar.
 */
export default function Loading() {
  return (
    <LoadingShell>
      <SkeletonPageHeader
        actions={2}
        icon={false}
        description={false}
        subline
      />

      <SkeletonCard bodyClassName="h-52" />
      <SkeletonCard title={false} bodyClassName="h-24" />

      <div className="space-y-4">
        <Skeleton className="h-5 w-56" />
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonCard key={index} bodyClassName="h-32" />
        ))}
      </div>
    </LoadingShell>
  );
}
