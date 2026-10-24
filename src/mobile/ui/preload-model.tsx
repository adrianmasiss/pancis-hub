"use client";

import { useEffect } from "react";
import { preloadMuscleModel } from "@/features/training/lib/model-preload";

/**
 * Al entrar a Entrenar, baja el maniqui 3D en segundo plano (cuando el hilo
 * esta libre), para que al abrirlo ya este. No pinta nada.
 */
export function PreloadModel() {
  useEffect(() => {
    const idle =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 600));
    const id = idle(() => preloadMuscleModel());
    return () => {
      if (window.cancelIdleCallback && typeof id === "number")
        window.cancelIdleCallback(id);
    };
  }, []);
  return null;
}
