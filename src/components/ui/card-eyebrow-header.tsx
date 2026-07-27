import { cn } from "@/lib/utils";

type CardEyebrowHeaderProps = {
  /** Texto del eyebrow. Se pinta en versalitas; se escribe en normal. */
  title: React.ReactNode;
  /** Enlace o control alineado al filo derecho. */
  action?: React.ReactNode;
  className?: string;
};

/**
 * Cabecera de tarjeta del handoff v2 (regla 2).
 *
 * La cabecera no es un titulo en negrita sino un eyebrow en versalitas
 * seguido de una regla divisoria, con la accion pegada al borde derecho. El
 * proposito es que el peso visual se lo lleve el dato de la tarjeta, no su
 * rotulo.
 */
export function CardEyebrowHeader({
  title,
  action,
  className,
}: CardEyebrowHeaderProps) {
  return (
    <div className={cn("card-header", className)}>
      <span className="card-eyebrow">{title}</span>
      {action}
    </div>
  );
}
