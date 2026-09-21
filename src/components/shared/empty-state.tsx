import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-card-raised/55 flex flex-col items-start justify-center gap-3 rounded-2xl px-6 py-10 text-left sm:min-h-48 sm:px-8 sm:py-12",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className="text-primary size-6"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      ) : null}
      <h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
      {description ? (
        <p className="text-muted-foreground max-w-[46ch] text-[0.8125rem] leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
