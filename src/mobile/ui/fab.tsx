"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus, type LucideIcon } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_PORTAL_ID } from "@/mobile/routes";
import { Haptic } from "./haptic";

export type FabAction = {
  label: string;
  /** Una linea bajo el nombre. */
  sub?: string;
  icon: LucideIcon;
  /**
   * El color del circulo del icono. Sin decirlo, la primera opcion va en el
   * acento y las demas en neutro; `ia` es el violeta del copiloto.
   */
  tone?: "accent" | "ia" | "neutral";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const sinSuscripcion = () => () => {};

/**
 * Boton «+» flotante abajo a la derecha, sobre la barra: la forma de agregar
 * en cada pantalla que agrega algo (y en ninguna otra). Con una sola accion
 * la hace directo; con varias, el fondo se oscurece y las opciones salen
 * apiladas del propio boton, que gira hasta ser una «×» (nov 2026, segun la
 * referencia del usuario). Antes abria una hoja desde abajo.
 *
 * El menu siempre esta montado y solo cambia `data-open`: con transiciones
 * (no animaciones de entrada) abrir y cerrar rapido se retoma desde donde va.
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
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLElement | null>(null);
  const portal = useSyncExternalStore(
    sinSuscripcion,
    () => document.getElementById(MOBILE_PORTAL_ID),
    () => null,
  );

  // Cambiar de pantalla (o de vista) cierra el menu. Se ajusta en el render,
  // no en un efecto: asi no hay un cuadro con el menu abierto en otra ruta.
  const ruta = `${usePathname()}?${useSearchParams()}`;
  const [rutaAbierta, setRutaAbierta] = useState(ruta);
  if (rutaAbierta !== ruta) {
    setRutaAbierta(ruta);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    // La primera opcion recibe el foco cuando ya se ve; Escape cierra.
    const t = window.setTimeout(() => firstRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar(true);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sola = actions.length === 1 ? actions[0]! : null;
  if (!portal || actions.length === 0) return null;

  function cerrar(devolverFoco = false) {
    setOpen(false);
    if (devolverFoco) fabRef.current?.focus();
  }

  const icono = <Plus size={24} strokeWidth={2.4} aria-hidden="true" />;

  if (sola?.href) {
    return createPortal(
      <Link
        href={sola.href}
        className="m-fab m-press"
        aria-label={label}
        onClick={() => triggerHaptic("selection")}
      >
        <Haptic />
        {icono}
      </Link>,
      portal,
    );
  }

  const menuId = `m-fab-menu-${label.replace(/\W+/g, "-")}`;

  return createPortal(
    <>
      {!sola && (
        <div
          className="m-fab-menu"
          data-open={open ? "" : undefined}
          inert={!open}
        >
          <button
            type="button"
            className="m-fab-scrim"
            aria-label="Cerrar"
            tabIndex={-1}
            onClick={() => cerrar()}
          />
          <ul className="m-fab-stack" id={menuId} aria-label={label}>
            {actions.map(
              ({ label: nombre, sub, icon: Icon, tone, ...a }, i) => {
                const contenido = (
                  <>
                    <span
                      className="m-fab-option-icon"
                      data-tone={tone ?? (i === 0 ? "accent" : "neutral")}
                      aria-hidden="true"
                    >
                      <Icon size={19} strokeWidth={2} />
                    </span>
                    <span className="m-fab-option-text">
                      <span className="m-fab-option-title">{nombre}</span>
                      {sub && <span className="m-fab-option-sub">{sub}</span>}
                    </span>
                  </>
                );
                const ref = (el: HTMLElement | null) => {
                  if (i === 0) firstRef.current = el;
                };
                // La mas cercana al boton sale primero: el abanico nace de el.
                const style = {
                  "--i": actions.length - 1 - i,
                } as CSSProperties;
                return (
                  <li key={nombre} style={style}>
                    {a.href && !a.disabled ? (
                      <Link
                        ref={ref}
                        href={a.href}
                        className="m-fab-option m-press"
                        onClick={() => {
                          triggerHaptic("selection");
                          cerrar();
                        }}
                      >
                        <Haptic />
                        {contenido}
                      </Link>
                    ) : (
                      <button
                        ref={ref}
                        type="button"
                        className="m-fab-option m-press"
                        disabled={a.disabled}
                        onClick={() => {
                          triggerHaptic("selection");
                          cerrar();
                          a.onClick?.();
                        }}
                      >
                        <Haptic />
                        {contenido}
                      </button>
                    )}
                  </li>
                );
              },
            )}
          </ul>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        className="m-fab m-press"
        data-open={open ? "" : undefined}
        aria-label={open ? "Cerrar opciones" : label}
        aria-expanded={sola ? undefined : open}
        aria-controls={sola ? undefined : menuId}
        disabled={sola?.disabled}
        onClick={() => {
          triggerHaptic("selection");
          if (sola) sola.onClick?.();
          else if (open) cerrar();
          else setOpen(true);
        }}
      >
        <Haptic />
        <span className="m-fab-glyph">{icono}</span>
      </button>
    </>,
    portal,
  );
}
