"use client";

import { useEffect, useRef } from "react";
import type { DragControls } from "motion/react";
import { triggerHaptic } from "@/lib/haptics";

const LONG_PRESS_MS = 450;

/**
 * Arrastrar tras mantener presionado, como al reordenar en iOS: un toque
 * normal sigue siendo un toque y deslizar sigue haciendo scroll; solo al
 * quedarse quieto medio segundo la fila se levanta y sigue al dedo.
 *
 * Mientras se arrastra se bloquea el scroll de la pagina (el `touchmove`
 * pasivo no se puede cancelar, por eso el listener es explicito) y se
 * traga el click que llega al soltar.
 */
export function useLongPressDrag(controls: DragControls, disabled = false) {
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const swallow = useRef(false);

  useEffect(() => {
    const block = (ev: TouchEvent) => {
      if (dragging.current) ev.preventDefault();
    };
    const end = () => {
      dragging.current = false;
    };
    document.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      document.removeEventListener("touchmove", block);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const cancel = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };

  return {
    onPointerDown(ev: React.PointerEvent) {
      // Si el arrastre anterior no termino en click, no hay nada que tragar.
      swallow.current = false;
      if (disabled || ev.button !== 0) return;
      const event = ev.nativeEvent;
      press.current = {
        x: ev.clientX,
        y: ev.clientY,
        timer: window.setTimeout(() => {
          press.current = null;
          dragging.current = true;
          swallow.current = true;
          triggerHaptic("selection");
          controls.start(event);
        }, LONG_PRESS_MS),
      };
    },
    onPointerMove(ev: React.PointerEvent) {
      const p = press.current;
      if (p && Math.hypot(ev.clientX - p.x, ev.clientY - p.y) > 8) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClickCapture(ev: React.MouseEvent) {
      if (!swallow.current) return;
      swallow.current = false;
      ev.preventDefault();
      ev.stopPropagation();
    },
    onContextMenu(ev: React.MouseEvent) {
      ev.preventDefault();
    },
  };
}
