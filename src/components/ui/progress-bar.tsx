import { cn } from "@/lib/utils";

type ProgressBarProps = {
  label: string;
  value: number;
  max: number;
  unit?: string;
  /**
   * Color del relleno. Por defecto el acento; cuando la barra representa un
   * macro debe pasarse su color (handoff, regla 6).
   */
  color?: string;
  className?: string;
};

/**
 * Barra de progreso con etiqueta y cifra (handoff v2, regla 6).
 *
 * Pista de 5px y radio 3px. La cifra va siempre visible junto a la etiqueta:
 * la barra sola comunica proporcion, no cantidad, y aqui hacen falta las dos.
 */
export function ProgressBar({
  label,
  value,
  max,
  unit,
  color = "var(--primary)",
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={className}>
      <div className="mb-[3px] flex items-baseline justify-between gap-3 text-xs">
        <span className="truncate">{label}</span>
        <span className="num text-muted-foreground shrink-0">
          <span className="text-foreground">{value}</span> / {max}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "h-[5px] overflow-hidden rounded-[3px]",
          "bg-[color-mix(in_oklch,var(--foreground)_8%,transparent)]",
        )}
      >
        <div
          className="h-full rounded-[3px] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  );
}
