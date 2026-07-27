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
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="label-micro">{label}</p>
      {/* La cifra va en monoespaciada tabular: las metricas en rejilla se
          alinean por si solas y se comparan de un vistazo. Sube a escala de
          display a partir de sm; en movil caben tres por fila y 34px no. */}
      <p className="num text-[1.75rem] leading-none font-medium sm:num-display">
        {value}
      </p>
      {delta && DeltaIcon ? (
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs",
            delta.tone === "good" && "text-positive",
            delta.tone === "bad" && "text-critical",
            delta.tone === "neutral" && "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="num">{delta.text}</span>
        </p>
      ) : null}
      {hint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}
