"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Lo de la sesion en curso que vive en el telefono: descanso, pausa abierta
 * y por donde ibas (ejercicio, valores a medio editar, filas añadidas). Lo
 * registrado (series, pausas cerradas) ya esta en el servidor; esto completa
 * el resto para que cerrar la app o recargar no te saque de la serie.
 *
 * Va en `localStorage` (antes `sessionStorage`, que la app instalada pierde
 * al cerrarse). Se lee con `useSyncExternalStore` para que el servidor y el
 * primer render del cliente coincidan.
 */
const PREFIX = "pancis:m-";

export const liveKeys = (sessionId: string) => ({
  rest: `${PREFIX}descanso:${sessionId}`,
  pause: `${PREFIX}pausa:${sessionId}`,
  progress: `${PREFIX}sesion:${sessionId}`,
});

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  // Otra pestaña (o la app y el navegador a la vez) tambien cuenta.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLive(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Sin almacenamiento no se recuerda al recargar. */
  }
  listeners.forEach((l) => l());
}

/**
 * Cambia lo guardado a partir de lo ultimo escrito (no de lo que vio el
 * render): dos cambios seguidos suman.
 */
export function updateLive<T>(key: string, initial: T, fn: (v: T) => T) {
  const raw = read(key);
  let current = initial;
  if (raw)
    try {
      current = JSON.parse(raw) as T;
    } catch {
      /* se queda el inicial */
    }
  const next = fn(current);
  if (next !== current) writeLive(key, next);
}

export function useStored<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = useMemo<T>(() => {
    if (!raw) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
    // `initial` es un literal nuevo en cada render; solo importa `raw`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  const set = useCallback((next: T) => writeLive(key, next), [key]);
  return [value, set] as const;
}

/** Al terminar o descartar: fuera todo lo de esa sesion. */
export function clearLive(sessionId: string) {
  for (const key of Object.values(liveKeys(sessionId))) writeLive(key, null);
}

/** Lo que dejaron sesiones anteriores (terminadas en otro equipo, etc.). */
export function pruneLive(keepSessionId: string) {
  try {
    const store = window.localStorage;
    for (let i = store.length - 1; i >= 0; i--) {
      const key = store.key(i);
      if (
        key &&
        /^pancis:m-(descanso|pausa|sesion):/.test(key) &&
        !key.endsWith(`:${keepSessionId}`)
      )
        store.removeItem(key);
    }
  } catch {
    /* nada que limpiar */
  }
}

export type LivePause = { since: number | null; ms: number };
