import { Plate, PlateBar } from "@/components/shared/plate";
import type { ToleranceKey } from "@/features/nutrition/lib/tolerances";

type MacroProgressProps = {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
  /**
   * Que macro es, para que herede su disco. El codigo tiene que ser el mismo
   * en toda la app: si en Hoy la proteina es el disco azul de 20 y en
   * Nutricion es una barra gris, deja de ser un codigo.
   */
  macro?: ToleranceKey;
};

/** Barra de un macro con su disco y sus valores visibles (nunca solo color). */
export function MacroProgress({
  label,
  consumed,
  target,
  unit = "g",
  macro,
}: MacroProgressProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span className="flex min-w-0 items-center gap-2">
          {macro ? <Plate macro={macro} showKg /> : null}
          <span className="text-foreground truncate">{label}</span>
        </span>
        <span className="num text-muted-foreground shrink-0 text-xs">
          <span className="text-foreground">{consumed}</span> / {target} {unit}
        </span>
      </div>
      <PlateBar macro={macro ?? "calories"} value={consumed} target={target} />
      <span className="sr-only">{`${label}: ${consumed} de ${target} ${unit}`}</span>
    </div>
  );
}
