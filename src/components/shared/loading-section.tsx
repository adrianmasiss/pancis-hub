import { Skeleton } from "@/components/ui/skeleton";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type LoadingSectionProps = {
  /** Cantidad de bloques de contenido simulados. */
  rows?: number;
  className?: string;
};

export function LoadingSection({ rows = 3, className }: LoadingSectionProps) {
  return (
    <div
      role="status"
      aria-label={messages.common.loading}
      className={cn("space-y-4", className)}
    >
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-xl" />
      ))}
      <span className="sr-only">{messages.common.loading}</span>
    </div>
  );
}
