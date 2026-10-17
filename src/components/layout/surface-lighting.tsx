"use client";

import { useEffect } from "react";

/** Delegated so server-rendered cards and portal controls share the same light. */
export function SurfaceLighting() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let target: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    const move = (event: PointerEvent) => {
      if (
        !finePointer.matches ||
        reducedMotion.matches ||
        event.pointerType === "touch"
      )
        return;
      target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-glow], .day-reading")
          : null;
      x = event.clientX;
      y = event.clientY;
      if (!target || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!target?.isConnected) return;
        // Illuminate both a nested action and its card without replacing
        // the card's independently animated corner highlights.
        let surface: HTMLElement | null = target;
        while (surface) {
          const rect = surface.getBoundingClientRect();
          surface.style.setProperty("--gx", `${x - rect.left}px`);
          surface.style.setProperty("--gy", `${y - rect.top}px`);
          surface =
            surface.parentElement?.closest<HTMLElement>(
              "[data-glow], .day-reading",
            ) ?? null;
        }
      });
    };
    const visibility = () => {
      document.documentElement.toggleAttribute(
        "data-motion-paused",
        document.hidden,
      );
    };
    visibility();
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
      document.documentElement.removeAttribute("data-motion-paused");
    };
  }, []);
  return null;
}
