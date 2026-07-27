import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingShell,
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/shared/loading-section";

/**
 * Nutricion: encabezado, selector de fecha, resumen del dia y la pila de
 * tarjetas de comida. El selector de fecha va primero y es angosto: si no se
 * reserva, el resumen sube y baja al hidratar.
 */
export default function Loading() {
  return (
    <LoadingShell>
      <SkeletonPageHeader actions={2} />

      <Skeleton className="h-9 w-full max-w-xs rounded-md" />

      <SkeletonCard bodyClassName="h-32" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonCard key={index} title={false} bodyClassName="h-20" />
        ))}
      </div>
    </LoadingShell>
  );
}
