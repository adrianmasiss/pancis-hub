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
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span className="text-foreground truncate">{label}</span>
        <span className="num text-muted-foreground shrink-0 text-xs">
          <span className="text-foreground">{consumed}</span> / {target} {unit}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={`${label}: ${consumed} de ${target} ${unit}`}
      />
    </div>
  );
}
