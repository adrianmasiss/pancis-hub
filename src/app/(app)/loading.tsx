import { LoadingSection } from "@/components/shared/loading-section";
import { isPhone } from "@/lib/device";
import { MobileSkeleton } from "@/mobile/ui/skeleton";

export default async function Loading() {
  // Telefono: el esqueleto de la vista movil, con su geometria.
  if (await isPhone()) return <MobileSkeleton variant="general" />;

  return <LoadingSection />;
}
