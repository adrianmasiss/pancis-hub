import "@/features/training/components/training-workspace.css";
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
  if (await isPhone()) return <MobileSkeleton variant="entrenar" />;

  return (
    <LoadingShell className="training-workspace">
      <SkeletonViewHeader actions={0} meta={false} description />
      <Skeleton className="h-11 w-64" />
      <Skeleton className="h-11 w-48" />
      <div className="training-session-layout">
        <SkeletonCard bodyClassName="h-96" />
        <SkeletonCard bodyClassName="h-[440px]" />
      </div>
      <SkeletonCard bodyClassName="h-24" />
    </LoadingShell>
  );
}
