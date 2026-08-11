import { cn } from "@/lib/utils";
import type { ToleranceKey } from "@/features/nutrition/lib/tolerances";

/**
 * El disco.
 *
 * El codigo de color de los discos olimpicos es una norma internacional que
 * nadie que levante tiene que aprenderse: 25 rojo, 20 azul, 15 amarillo, 10
 * verde, 5 blanco. Aqui cada macro se queda con uno PARA SIEMPRE, de modo que
 * el color deja de decorar y pasa a ser el dato.
 *
 * Las calorias no llevan disco: son la barra, y van en acero.
 */
export const PLATE_BY_MACRO: Record<
  ToleranceKey,
  { color: string; ink: string; kg: string }
> = {
  calories: { color: "var(--macro-energy)", ink: "var(--background)", kg: "" },
  protein: { color: "var(--macro-protein)", ink: "#fff", kg: "20" },
  carbs: { color: "var(--macro-carbs)", ink: "#fff", kg: "15" },
  fat: { color: "var(--macro-fat)", ink: "#fff", kg: "25" },
  fiber: { color: "var(--macro-fiber)", ink: "#fff", kg: "10" },
};

/**
 * Chip de disco. El numeral de kilos va dentro porque es lo que lleva impreso
 * un disco de verdad, y porque da una segunda pista de identidad a quien no
 * distingue bien los colores.
 */
export function Plate({
  macro,
  className,
  showKg = false,
}: {
  macro: ToleranceKey;
  className?: string;
  /** El numeral solo aparece donde hay sitio para leerlo. */
  showKg?: boolean;
}) {
  const plate = PLATE_BY_MACRO[macro];
  return (
    <span
      className={cn("plate", className)}
      style={
        {
          "--plate-color": plate.color,
          "--plate-ink": plate.ink,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {showKg ? plate.kg : null}
    </span>
  );
}

/**
 * Barra de magnitud: el ancho ES la cantidad, en el color del macro.
 *
 * Sustituye a la barra de progreso redondeada de siempre. Va a canto vivo y
 * sobre una pista del grosor de una regla, no sobre una pildora gris.
 */
export function PlateBar({
  macro,
  value,
  target,
  planned,
  className,
}: {
  macro: ToleranceKey;
  value: number;
  target: number;
  /**
   * Donde te dejaria el plan del dia. Va como muesca sobre la misma barra en
   * vez de como columna aparte: la pregunta es "¿el plan me lleva ahi?", y
   * eso se responde mirando, no comparando dos cifras.
   */
  planned?: number | null;
  className?: string;
}) {
  const pct = target > 0 ? Math.min(Math.max(value / target, 0), 1) : 0;
  const over = target > 0 && value > target;
  const plate = PLATE_BY_MACRO[macro];
  const plannedPct =
    planned != null && target > 0
      ? Math.min(Math.max(planned / target, 0), 1)
      : null;

  return (
    <span
      className={cn("bg-rule/60 relative block h-1.5 w-full", className)}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 transition-[width] duration-200 ease-out"
        style={{
          width: `${pct * 100}%`,
          background: plate.color,
        }}
      />
      {plannedPct !== null ? (
        <span
          className="bg-foreground absolute w-[2px]"
          style={{
            left: `calc(${plannedPct * 100}% - 1px)`,
            top: "-3px",
            bottom: "-3px",
          }}
        />
      ) : null}
      {/* Pasarse tiene su propia marca: un canto grueso al final, no un color
          distinto que obligue a aprender otra convencion. */}
      {over ? (
        <span className="bg-foreground absolute inset-y-0 right-0 w-[3px]" />
      ) : null}
    </span>
  );
}
