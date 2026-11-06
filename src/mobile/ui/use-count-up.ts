"use client";

import { useEffect, useRef, useState } from "react";

/** El numero sube hasta `to` en ~450 ms (sin movimiento: llega directo). */
export function useCountUp(to: number) {
  const [shown, setShown] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    const start = from.current;
    if (
      start === to ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      from.current = to;
      const id = requestAnimationFrame(() => setShown(to));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 450);
      const eased = 1 - (1 - k) ** 3;
      setShown(Math.round(start + (to - start) * eased));
      if (k < 1) id = requestAnimationFrame(tick);
      else from.current = to;
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      from.current = to;
    };
  }, [to]);
  return shown;
}
