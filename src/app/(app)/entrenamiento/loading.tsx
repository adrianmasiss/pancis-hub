import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingShell,
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/shared/loading-section";

/**
 * Entrenamiento: encabezado con tres acciones y la rejilla de rutinas, que a
 * partir de lg se parte en dos columnas. El esqueleto repite ese quiebre para
 * que la pagina no se reacomode al llegar los planes.
 */
export default function Loading() {
  return (
    <LoadingShell>
      <SkeletonPageHeader actions={3} />

      <section className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <SkeletonCard key={index} bodyClassName="h-28" />
          ))}
        </div>
      </section>
    </LoadingShell>
  );
}
