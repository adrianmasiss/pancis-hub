import { Progress } from "@/components/ui/progress";

type MacroProgressProps = {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
};

/** Barra de progreso de un macro con valores visibles (no solo color). */
export function MacroProgress({
  label,
  consumed,
  target,
  unit = "g",
}: MacroProgressProps) {
  const percent =
    target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {consumed} / {target} {unit}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={`${label}: ${consumed} de ${target} ${unit}`}
      />
    </div>
  );
}
