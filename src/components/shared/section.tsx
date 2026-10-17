import { cn } from "@/lib/utils";

/** Agrupador semantico con superficie opcional, titulo y accion local. */
export function Section({
  title,
  description,
  action,
  children,
  className,
  /**
   * `plain` quita la superficie y deja el contenido sobre el suelo: para
   * bloques que ya traen su propia caja dentro, como una lista de tarjetas.
   */
  variant = "card",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "card" | "plain";
}) {
  return (
    <section
      className={cn(variant === "card" && "v11-card v11-padded", className)}
    >
      {title ? (
        /*
          Envuelve. Con un titulo y dos botones al lado —"Rutinas", "Importar
          rutina", "Crear rutina"— la fila se salia de 390px y el ultimo boton
          quedaba cortado contra el borde. Envolviendo, la accion baja entera a
          su propia linea en vez de desbordar.
        */
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="text-[15px] font-semibold tracking-[-0.012em]">
            {title}
          </h2>
          {action ? <div>{action}</div> : null}
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
