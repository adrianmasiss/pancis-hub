import {
  LoadingShell,
  SkeletonCard,
  SkeletonChart,
  SkeletonMetricRow,
  SkeletonPageHeader,
  SkeletonRows,
} from "@/components/shared/loading-section";

/**
 * Progreso: encabezado, tarjeta de tendencia (tres metricas sobre la grafica)
 * y la tabla de mediciones. La grafica es la pieza que mas altura ocupa, asi
 * que se reserva explicitamente.
 */
export default function Loading() {
  return (
    <LoadingShell>
      <SkeletonPageHeader actions={1} />

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
