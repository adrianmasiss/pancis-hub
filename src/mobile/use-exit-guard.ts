"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Pone la guardia encima del historial si no esta ya. */
function armGuard(armed: RefObject<boolean>) {
  if (armed.current) return;
  if (!window.history.state?.mGuard)
    window.history.pushState(
      { ...window.history.state, mGuard: true },
      "",
      window.location.href,
    );
  armed.current = true;
}

/**
 * Atras del sistema (gesto de iOS, boton de Android) que pregunta antes de
 * salir: deja una entrada de historial de guardia, con la misma URL, encima
 * de la pantalla. Ir atras solo la quita (Next restaura la misma ruta, nada
 * cambia) y llama a `onAttempt`, que decide: abrir una hoja, volver a armar
 * (con el `rearm` que recibe, o `arm()`) o salir de verdad.
 *
 * La marca va en `history.state`, asi recargar sobre la guardia no apila
 * otra.
 */
export function useExitGuard(onAttempt: (rearm: () => void) => void) {
  const attempt = useRef(onAttempt);
  useEffect(() => {
    attempt.current = onAttempt;
  });
  const armed = useRef(false);

  useEffect(() => {
    // Un tick despues: al llegar navegando, el router de Next escribe la
    // nueva entrada en su propio efecto, que corre despues de este. Antes de
    // eso la guardia quedaba con la URL de la pantalla anterior.
    const timer = window.setTimeout(() => armGuard(armed), 0);
    const onPop = () => {
      if (!armed.current) return;
      armed.current = false;
      attempt.current(() => armGuard(armed));
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return {
    arm: () => armGuard(armed),
    /** Deja de vigilar. Devuelve si la guardia seguia encima del historial. */
    disarm: () => {
      const was = armed.current && Boolean(window.history.state?.mGuard);
      armed.current = false;
      return was;
    },
  };
}
