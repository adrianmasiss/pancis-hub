"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * El interruptor de "No cerrar sesion", con la forma que mando el usuario.
 *
 * Por dentro SIGUE siendo un `<input type="checkbox">`: lo unico que cambia es
 * lo que se pinta. Eso no es un detalle —es lo que mantiene el teclado (tab y
 * espacio), el estado que anuncia un lector de pantalla y el envio del
 * formulario—. El SVG va `aria-hidden` porque es el dibujo del mismo control,
 * no un control aparte, y el nombre accesible lo da el texto de la etiqueta,
 * que envuelve a los dos.
 *
 * `role="switch"` en vez de casilla: es lo que describe una cosa que se
 * enciende y se apaga, y es lo que el dibujo promete.
 *
 * El filtro `goo` lleva un id UNICO por instancia. Un id repetido en el
 * documento hace que todos los `url(#goo)` apunten al primero, asi que dos
 * interruptores en la misma pagina compartirian filtro; `useId` lo evita, y se
 * le quitan los caracteres que React usa para envolverlo, que no son validos
 * dentro de `url(#...)`.
 */
export function RememberToggle({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  const goo = `goo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <label className={cn("remember-toggle", className)}>
      <span className="toggle-container">
        <input
          type="checkbox"
          role="switch"
          className="toggle-input"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 292 142"
          className="toggle"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M71 142C31.7878 142 0 110.212 0 71C0 31.7878 31.7878 0 71 0C110.212 0 119 30 146 30C173 30 182 0 221 0C260 0 292 31.7878 292 71C292 110.212 260.212 142 221 142C181.788 142 173 112 146 112C119 112 110.212 142 71 142Z"
            className="toggle-background"
          />
          <rect
            rx="6"
            height="64"
            width="12"
            y="39"
            x="64"
            className="toggle-icon on"
          />
          <path
            d="M221 91C232.046 91 241 82.0457 241 71C241 59.9543 232.046 51 221 51C209.954 51 201 59.9543 201 71C201 82.0457 209.954 91 221 91ZM221 103C238.673 103 253 88.6731 253 71C253 53.3269 238.673 39 221 39C203.327 39 189 53.3269 189 71C189 88.6731 203.327 103 221 103Z"
            fillRule="evenodd"
            className="toggle-icon off"
          />
          <g filter={`url(#${goo})`}>
            <rect
              rx="29"
              height="58"
              width="116"
              y="42"
              x="13"
              className="toggle-circle-center"
            />
            <rect
              rx="58"
              height="114"
              width="114"
              y="14"
              x="14"
              className="toggle-circle left"
            />
            <rect
              rx="58"
              height="114"
              width="114"
              y="14"
              x="164"
              className="toggle-circle right"
            />
          </g>
          <filter id={goo}>
            <feGaussianBlur
              stdDeviation="10"
              result="blur"
              in="SourceGraphic"
            />
            <feColorMatrix
              result="goo"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              mode="matrix"
              in="blur"
            />
          </filter>
        </svg>
      </span>
      {label}
    </label>
  );
}
