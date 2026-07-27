"use client";

import confetti from "canvas-confetti";
import { triggerHaptic } from "@/lib/haptics";

export function fireCelebration() {
  triggerHaptic("success");

  // Ráfaga de partículas neón deportiva
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Confeti dentro de la paleta del sistema: bronce, laton, arena y piedra.
  // canvas-confetti no resuelve variables CSS, asi que los valores van fijos y
  // replican los tokens --primary / --caution / --muted de tema claro.
  const PALETTE = ["#8A5A34", "#A8763F", "#C4A582", "#D9D2C7"];

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: PALETTE,
  });
  fire(0.2, {
    spread: 60,
    colors: PALETTE,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: PALETTE,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: PALETTE,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: PALETTE,
  });
}
