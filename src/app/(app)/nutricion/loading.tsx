import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingShell,
  SkeletonCard,
  SkeletonViewHeader,
} from "@/components/shared/loading-section";
import { isPhone } from "@/lib/device";
import { MobileSkeleton } from "@/mobile/ui/skeleton";

export default async function Loading() {
  // Telefono: el esqueleto de la vista movil, con su geometria.
  if (await isPhone()) return <MobileSkeleton variant="nutricion" />;

  return (
    <LoadingShell>
      <SkeletonViewHeader actions={1} subline />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-10 w-64 max-w-full" />
      <SkeletonCard title={false} bodyClassName="h-36" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} bodyClassName="h-24" />
          ))}
        </div>
        <SkeletonCard bodyClassName="h-40" />
      </div>
    </LoadingShell>
  );
}
