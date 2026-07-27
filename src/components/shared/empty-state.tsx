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
        "border-hairline flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center sm:py-14",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className="text-muted-foreground/70 size-6"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      ) : null}
      <h2 className="text-[0.9375rem] font-medium tracking-[-0.012em]">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground max-w-[46ch] text-[0.8125rem] leading-relaxed text-balance">
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
