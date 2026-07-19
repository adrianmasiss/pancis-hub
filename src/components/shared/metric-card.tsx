import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  /**
   * Delta opcional. `tone` comunica si el cambio es favorable; el signo y el
   * icono acompanan siempre al color (nunca color solo).
   */
  delta?: {
    text: string;
    direction: "up" | "down" | "flat";
    tone: "good" | "bad" | "neutral";
  };
  className?: string;
};

const DELTA_ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function MetricCard({
  label,
  value,
  hint,
  delta,
  className,
}: MetricCardProps) {
  const DeltaIcon = delta ? DELTA_ICONS[delta.direction] : null;
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {delta && DeltaIcon ? (
        <p
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            delta.tone === "good" && "text-primary",
            delta.tone === "bad" && "text-destructive",
            delta.tone === "neutral" && "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5" aria-hidden="true" />
          {delta.text}
        </p>
      ) : null}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
