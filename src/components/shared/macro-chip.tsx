import { Beef, Droplet, Flame, Leaf, Wheat, type LucideIcon } from "lucide-react";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const m = messages.macros;

export type MacroType = "calories" | "protein" | "carbs" | "fat" | "fiber";

const MACRO_ICON: Record<MacroType, LucideIcon> = {
  calories: Flame,
  protein: Beef,
  carbs: Wheat,
  fat: Droplet,
  fiber: Leaf,
};

// Reutiliza los tokens de color de graficos ya definidos en globals.css.
const MACRO_COLOR: Record<MacroType, string> = {
  calories: "text-chart-1",
  protein: "text-chart-2",
  carbs: "text-chart-4",
  fat: "text-chart-3",
  fiber: "text-chart-5",
};

/** Redondeo consistente: enteros para kcal, un decimal para gramos. */
function formatMacroValue(type: MacroType, value: number): string {
  if (type === "calories") return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

type MacroChipProps = {
  type: MacroType;
  value: number;
  /** "full": "Proteinas: 18 g" — "compact": icono + "18 g". */
  variant?: "full" | "compact";
  className?: string;
};

export function MacroChip({
  type,
  value,
  variant = "compact",
  className,
}: MacroChipProps) {
  const Icon = MACRO_ICON[type];
  const meta = m[type];
  const formatted = `${formatMacroValue(type, value)} ${meta.unit}`;

  if (variant === "full") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <Icon className={cn("size-4 shrink-0", MACRO_COLOR[type])} aria-hidden="true" />
        <span>
          {meta.label}: <span className="font-medium">{formatted}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        className,
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", MACRO_COLOR[type])} aria-hidden="true" />
      {formatted}
    </span>
  );
}

/** Etiqueta corta de un macro (ej. para inputs/formularios). */
export function macroLabel(type: MacroType): string {
  return m[type].label;
}

/** Unidad de un macro (ej. "g", "kcal"). */
export function macroUnit(type: MacroType): string {
  return m[type].unit;
}
