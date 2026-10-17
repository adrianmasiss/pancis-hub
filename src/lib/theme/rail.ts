"use client";

import { useCallback, useSyncExternalStore } from "react";

export const RAIL_STORAGE_KEY = "pancis-rail-capsules";

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

export type Rail = {
  /** La eleccion explicita, o `null` si manda el punto de corte. */
  pinned: RailState | null;
  /** `true` cuando el riel muestra solo iconos. */
  collapsed: boolean;
  toggle: () => void;
};

/** Collapsed capsule by default; an explicit expansion persists locally. */
export function useRail(): Rail {
  const pinned = useSyncExternalStore(
    subscribeStore,
    readStoredRail,
    () => null,
  );

  const collapsed = pinned === "collapsed";

  const toggle = useCallback(() => {
    storeRail(collapsed ? "expanded" : "collapsed");
  }, [collapsed]);

  return { pinned, collapsed, toggle };
}
