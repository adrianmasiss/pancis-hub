"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * `true` cuando el barrido debe saltarse: o la persona pidio menos movimiento,
 * o el entorno no puede escalonar fotogramas (pruebas, captura de miniaturas).
 * Sin `requestAnimationFrame` el arco se quedaria en cero para siempre, que es
 * peor que no animarlo.
 */
function skipAnimation(): boolean {
  return (
    window.matchMedia(REDUCED_QUERY).matches ||
    typeof window.requestAnimationFrame !== "function"
  );
}

/**
 * Devuelve `false` en el primer fotograma pintado y `true` en el siguiente.
 *
 * Existe porque el barrido de un anillo o un medidor NO se puede escribir con
 * `@keyframes`: el valor final —el arco de cada tarjeta— lo calcula el
 * servidor a partir de los datos, asi que el fotograma inicial tiene que ser
 * el MISMO nodo con otro `stroke-dashoffset`, no otra regla. Sin esos dos
 * fotogramas el navegador no tiene nada que interpolar y la transicion no
 * dispara.
 *
 * La preferencia de movimiento se lee con `useSyncExternalStore` y no con un
 * `setState` dentro del efecto: es un sistema externo a React —una media
 * query—, el servidor puede dar su propia respuesta sin adivinar, y si la
 * persona la cambia con la pantalla abierta esto se enterta. Escribirla con
 * `setState` sincrono en el efecto encadena un render extra y lo prohibe
 * `react-hooks/set-state-in-effect`.
 */
export function useSweep(): boolean {
  const skip = useSyncExternalStore(
    subscribeReduced,
    skipAnimation,
    () => false,
  );
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (skip) return;

    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setPainted(true));
    });

    return () => {
      window.cancelAnimationFrame(outer);
      if (inner) window.cancelAnimationFrame(inner);
    };
  }, [skip]);

  return skip || painted;
}
