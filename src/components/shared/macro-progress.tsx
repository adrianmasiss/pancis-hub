import { MagnitudeBar } from "@/components/shared/magnitude";

type MacroProgressProps = {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
};

/** Barra de un macro con sus valores visibles (nunca solo color). */
export function MacroProgress({
  label,
  consumed,
  target,
  unit = "g",
}: MacroProgressProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span className="text-foreground min-w-0 truncate">{label}</span>
        <span className="num text-muted-foreground shrink-0 text-xs">
          <span className="text-foreground">{consumed}</span> / {target} {unit}
        </span>
      </div>
      <MagnitudeBar value={consumed} target={target} />
      <span className="sr-only">{`${label}: ${consumed} de ${target} ${unit}`}</span>
    </div>
  );
}
