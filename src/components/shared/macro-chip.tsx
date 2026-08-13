import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const m = messages.macros;

export type MacroType = "calories" | "protein" | "carbs" | "fat" | "fiber";

/** Redondeo consistente: enteros para kcal, un decimal para gramos. */
function formatMacroValue(type: MacroType, value: number): string {
  if (type === "calories") return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

type MacroChipProps = {
  type: MacroType;
  value: number;
  /** "full": "Proteinas: 18 g" — "compact": "P 18 g". */
  variant?: "full" | "compact";
  className?: string;
};

/**
 * Un macro y su cantidad.
 *
 * Llevaba un icono con un color por macro —llama, carne, trigo, gota, hoja—
 * sobre los tokens de grafico. Eso era el "codigo de disco" que este sistema
 * retiro: pedia cinco colores, y aqui solo hay uno. Peor aun, `chart-1` ES el
 * naranja del acento, asi que cada cifra de calorias se pintaba del color
 * reservado a lo accionable y al avance del dia.
 *
 * La identidad del macro pasa a su ROTULO, que se lee y no hay que aprenderse.
 * En compacto va la forma corta que el diccionario ya tenia sin usar (`short`:
 * P, C, G, F) porque cuatro macros en una fila de 390px no admiten "Carbo-
 * hidratos"; en `full` va el nombre entero.
 */
export function MacroChip({
  type,
  value,
  variant = "compact",
  className,
}: MacroChipProps) {
  const meta = m[type];
  const formatted = `${formatMacroValue(type, value)} ${meta.unit}`;

  if (variant === "full") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span>
          {meta.label}: <span className="num font-medium">{formatted}</span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      {/* El rotulo corto se lee de un vistazo, pero fuera de contexto "G" no
          dice "Grasas": quien escucha la pantalla recibe el nombre entero. */}
      <span className="text-subtle-foreground" aria-hidden="true">
        {meta.short}
      </span>
      <span className="sr-only">{meta.label}:</span>
      <span className="num">{formatted}</span>
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
