import {
  LoadingShell,
  SkeletonCard,
  SkeletonChart,
  SkeletonMetricRow,
  SkeletonViewHeader,
  SkeletonRows,
} from "@/components/shared/loading-section";
import { isPhone } from "@/lib/device";
import { MobileSkeleton } from "@/mobile/ui/skeleton";

/**
 * Progreso: encabezado, tarjeta de tendencia (tres metricas sobre la grafica)
 * y la tabla de mediciones. La grafica es la pieza que mas altura ocupa, asi
 * que se reserva explicitamente.
 */
export default async function Loading() {
  // Telefono: el esqueleto de la vista movil, con su geometria.
  if (await isPhone()) return <MobileSkeleton variant="progreso" />;

  return (
    <LoadingShell>
      <SkeletonViewHeader actions={1} />

      <SkeletonCard>
        <div className="space-y-4">
          <SkeletonMetricRow count={3} />
          <SkeletonChart />
        </div>
      </SkeletonCard>

      <SkeletonRows rows={5} />
    </LoadingShell>
  );
}
