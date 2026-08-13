import { cn } from "@/lib/utils";

/**
 * Una tarjeta con su titulo dentro.
 *
 * Sustituye a `Card` en todas las pantallas. Sobre el marino profundo del
 * tema oscuro, una superficie elevada agrupa mejor que un filete: la jerarquia
 * la hace el salto de tono, no el grosor de una regla.
 *
 * Se probo lo contrario —secciones separadas por reglas de 1, 2 y 3 px sobre
 * el suelo— y funcionaba en un sistema de alto contraste, pero con estas
 * superficies el filete desaparece.
 */
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
      className={cn(
        variant === "card" && "surface-card px-5 py-5",
        className,
      )}
    >
      {title ? (
        /*
          Envuelve. Con un titulo y dos botones al lado —"Rutinas", "Importar
          rutina", "Crear rutina"— la fila se salia de 390px y el ultimo boton
          quedaba cortado contra el borde. Envolviendo, la accion baja entera a
          su propia linea en vez de desbordar.
        */
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
          <h2 className="display-title">{title}</h2>
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
