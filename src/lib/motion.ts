"use client";

import { useReducedMotion, type Transition, type Variants } from "motion/react";

/**
 * Configuraciones de físicas de resorte (Springs) tipo Apple/iOS.
 */
export const springPresets = {
  // Resorte suave para pestañas, modals y sheets
  gentle: {
    type: "spring",
    stiffness: 280,
    damping: 28,
  } as Transition,

  // Resorte kinético para botones, badges y respuestas al toque
  bouncy: {
    type: "spring",
    stiffness: 400,
    damping: 22,
    mass: 0.8,
  } as Transition,

  // Resorte tenso para elementos interactivos pequeños
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 32,
  } as Transition,
};

/** Transición instantánea: el estado final, sin recorrido. */
export const instant: Transition = { duration: 0 };

/**
 * Devuelve la transición pedida, o una instantánea si el sistema pide reducir
 * el movimiento.
 *
 * El bloque `prefers-reduced-motion` de globals.css solo neutraliza animaciones
 * y transiciones de CSS. Motion anima por JS y escribe estilos en línea, así
 * que queda fuera de ese bloque y hay que atenderlo aquí. Regla del sistema:
 * el elemento salta directo a su estado final, nunca se queda a medias.
 */
export function useSafeTransition(transition: Transition): Transition {
  const shouldReduce = useReducedMotion();
  return shouldReduce ? instant : transition;
}

/**
 * Variantes de animación reutilizables para tarjetas y elementos de lista
 */
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springPresets.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: 0.15 },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const slideUpSheet: Variants = {
  hidden: { y: "100%", opacity: 0.5 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springPresets.gentle,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};
