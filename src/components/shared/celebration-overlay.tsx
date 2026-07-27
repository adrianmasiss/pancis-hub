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

  // Confeti dentro de la paleta "Grafito": acero, acero palido, acero hondo y
  // gris frio. canvas-confetti no resuelve variables CSS, asi que los valores
  // van fijos; se eligen tonos medios que se sostienen en claro y en oscuro.
  const PALETTE = ["#7fa8c9", "#b7c9d9", "#5d8fa8", "#99a1ad"];

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
