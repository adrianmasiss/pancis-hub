import { cn } from "@/lib/utils";

/**
 * Un tramo de suelo, no una tarjeta.
 *
 * Sustituye a `Card` en todas las pantallas del sistema. Lo que anuncia una
 * seccion es la regla gruesa de arriba —el canto del disco— y el aire que la
 * precede; no un borde alrededor ni una sombra. Apilar seis de estas produce
 * una hoja continua que se lee de arriba abajo, que es exactamente lo que una
 * pila de tarjetas del mismo peso no consigue.
 */
export function Section({
  title,
  description,
  action,
  children,
  className,
  /**
   * Por defecto `band`, la regla de 2px. `plate` es el canto grueso y se
   * reserva a LA seccion que manda en la pantalla: si todas lo llevan, el
   * grosor deja de significar jerarquia y solo hace ruido.
   */
  weight = "band",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  weight?: "plate" | "band";
}) {
  return (
    <section
      className={cn(
        weight === "plate" ? "rule-plate" : "rule-band",
        "pt-5",
        className,
      )}
    >
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="display-title">{title}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {description ? (
        <p className="text-muted-foreground mb-4 max-w-[62ch] text-sm text-pretty">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}
