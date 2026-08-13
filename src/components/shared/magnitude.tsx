import { cn } from "@/lib/utils";

/**
 * La barra de magnitud: el ancho ES la cantidad.
 *
 * Sustituye al "codigo de disco" (un chip de color por macro, con su numeral
 * de kilos). Aquel sistema pedia cinco colores; este sistema tiene UNO, y el
 * naranja de la marca ya esta ocupado por lo accionable. Entonces la identidad
 * del macro la lleva su rotulo, que se lee, y la barra se reserva para lo
 * unico que el color no puede decir: cuanto.
 *
 * Tres estados y ninguno mas:
 *   - normal   la barra en el acento
 *   - excedido la barra en critico, hasta el tope
 *   - plan     una muesca vertical donde te dejaria el plan del dia
 */
export function MagnitudeBar({
  value,
  target,
  planned,
  className,
}: {
  value: number;
  target: number;
  /**
   * Donde te dejaria el plan del dia. Va como muesca sobre la misma barra en
   * vez de como columna aparte: la pregunta es "¿el plan me lleva ahi?", y eso
   * se responde mirando, no comparando dos cifras.
   */
  planned?: number | null;
  className?: string;
}) {
  const pct = target > 0 ? Math.min(Math.max(value / target, 0), 1) : 0;
  const over = target > 0 && value > target;
  const plannedPct =
    planned != null && target > 0
      ? Math.min(Math.max(planned / target, 0), 1)
      : null;

  return (
    <span
      className={cn(
        "bg-rule relative block h-1.5 w-full overflow-hidden rounded-full",
        className,
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          over ? "bg-critical" : "bg-primary",
        )}
        style={{
          width: `${pct * 100}%`,
          transition: "width var(--dur-base) var(--ease-spring)",
        }}
      />
      {plannedPct !== null ? (
        <span
          className="bg-foreground/70 absolute inset-y-0 w-[2px]"
          style={{ left: `calc(${plannedPct * 100}% - 1px)` }}
        />
      ) : null}
    </span>
  );
}
