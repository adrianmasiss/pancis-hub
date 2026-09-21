"use client";

import { useCallback, useSyncExternalStore } from "react";

export const RAIL_STORAGE_KEY = "pancis-rail";

/** El riel se despliega solo desde este ancho; debajo arranca colapsado. */
const EXPANDED_QUERY = "(min-width: 1280px)";

export type RailState = "expanded" | "collapsed";

function isRailState(value: unknown): value is RailState {
  return value === "expanded" || value === "collapsed";
}

function readStoredRail(): RailState | null {
  try {
    const stored = window.localStorage.getItem(RAIL_STORAGE_KEY);
    return isRailState(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * El pin vive en localStorage, que es un sistema externo a React. Leerlo con
 * `useSyncExternalStore` en vez de con `useState` + `useEffect` evita el
 * `setState` sincrono dentro del efecto —que encadena renders— y hace que el
 * primer render del cliente ya coincida con el del servidor.
 */
const listeners = new Set<() => void>();

function subscribeStore(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function storeRail(state: RailState): void {
  try {
    window.localStorage.setItem(RAIL_STORAGE_KEY, state);
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }
  for (const listener of listeners) listener();
}

function subscribeQuery(onChange: () => void): () => void {
  const media = window.matchMedia(EXPANDED_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export type Rail = {
  /** La eleccion explicita, o `null` si manda el punto de corte. */
  pinned: RailState | null;
  /** `true` cuando el riel muestra solo iconos. */
  collapsed: boolean;
  toggle: () => void;
};

/**
 * Estado del riel: el pin explicito de la persona si existe, y si no, el punto
 * de corte. El servidor rinde siempre la version del punto de corte, que es lo
 * que el CSS ya sirve, asi que no hay salto al hidratar.
 */
export function useRail(): Rail {
  const pinned = useSyncExternalStore(
    subscribeStore,
    readStoredRail,
    () => null,
  );

  const wideEnough = useSyncExternalStore(
    subscribeQuery,
    () => window.matchMedia(EXPANDED_QUERY).matches,
    () => false,
  );

  const collapsed = pinned ? pinned === "collapsed" : !wideEnough;

  const toggle = useCallback(() => {
    storeRail(collapsed ? "expanded" : "collapsed");
  }, [collapsed]);

  return { pinned, collapsed, toggle };
}
