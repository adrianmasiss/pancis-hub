import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingShell,
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/shared/loading-section";

/**
 * Entrenamiento: encabezado con UNA accion, la lista de rutinas y las tres
 * secciones de lectura (historial, marcas, series por musculo).
 *
 * Reserva una sola columna, como la pagina: la rejilla de dos columnas se
 * retiro, y un esqueleto en dos columnas prometia un ancho que no llegaba.
 */
export default function Loading() {
  return (
    <LoadingShell>
      <SkeletonPageHeader actions={1} icon={false} description={false} />

      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonCard key={index} bodyClassName="h-20" />
        ))}
      </div>

      <SkeletonCard bodyClassName="h-24" />
      <SkeletonCard bodyClassName="h-24" />
    </LoadingShell>
  );
}
