"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Plus, type LucideIcon } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_PORTAL_ID } from "@/mobile/routes";
import { Sheet } from "./sheet";

export type FabAction = {
  label: string;
  /** Una linea bajo el nombre, en la hoja de opciones. */
  sub?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const sinSuscripcion = () => () => {};

/**
 * Boton «+» flotante abajo a la derecha, sobre la barra: la forma de agregar
 * en cada pantalla que agrega algo (y en ninguna otra). Con una sola accion
 * la hace directo; con varias abre una hoja para elegir.
 *
 * Vive en el portal de la vista movil: dentro de la pantalla, la transicion
 * entre rutas (un `transform`) lo arrastraria con ella.
 */
export function Fab({
  label,
  actions,
}: {
  /** Nombre accesible: «Agregar rutina», «Agregar alimento»… */
  label: string;
  actions: FabAction[];
}) {
  const [open, setOpen] = useState(false);
  const portal = useSyncExternalStore(
    sinSuscripcion,
    () => document.getElementById(MOBILE_PORTAL_ID),
    () => null,
  );
  const sola = actions.length === 1 ? actions[0]! : null;
  if (!portal || actions.length === 0) return null;

  const icono = <Plus size={24} strokeWidth={2.4} aria-hidden="true" />;

  return createPortal(
    <>
      {sola?.href ? (
        <Link
          href={sola.href}
          className="m-fab m-press"
          aria-label={label}
          onClick={() => triggerHaptic("selection")}
        >
          {icono}
        </Link>
      ) : (
        <button
          type="button"
          className="m-fab m-press"
          aria-label={label}
          aria-haspopup={sola ? undefined : "dialog"}
          disabled={sola?.disabled}
          onClick={() => {
            triggerHaptic("selection");
            if (sola) sola.onClick?.();
            else setOpen(true);
          }}
        >
          {icono}
        </button>
      )}

      {!sola && (
        <Sheet open={open} onOpenChange={setOpen} title={label}>
          <div className="m-fab-options">
            {actions.map(({ label: nombre, sub, icon: Icon, ...a }) => {
              const contenido = (
                <>
                  <span className="m-fab-option-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="m-list-row-main">
                    <span className="m-list-row-title">{nombre}</span>
                    {sub && <span className="m-list-row-sub">{sub}</span>}
                  </span>
                  <ChevronRight
                    className="m-chevron"
                    size={18}
                    aria-hidden="true"
                  />
                </>
              );
              return a.href && !a.disabled ? (
                <Link
                  key={nombre}
                  href={a.href}
                  className="m-list-row m-press"
                  onClick={() => setOpen(false)}
                >
                  {contenido}
                </Link>
              ) : (
                <button
                  key={nombre}
                  type="button"
                  className="m-list-row m-press"
                  disabled={a.disabled}
                  onClick={() => {
                    setOpen(false);
                    a.onClick?.();
                  }}
                >
                  {contenido}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </>,
    portal,
  );
}
