import type { ReactNode } from "react";
import "./expand-action.css";

/** Clase del contenedor (un `<Link>` o un `<button>`). */
export const expandActionClass = "expand-action";

/**
 * Interior de la accion que se expande: el circulo con el icono y el rotulo.
 * Va dentro de un enlace o un boton con `expandActionClass`; ese elemento
 * debe llevar `aria-label`, porque el rotulo se oculta al expandirse.
 */
export function ExpandActionInner({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <>
      <span className="expand-action-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="expand-action-text" aria-hidden="true">
        {label}
      </span>
    </>
  );
}
