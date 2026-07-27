/**
 * Módulo de retroalimentación táctil (Háptica) para experiencia móvil premium.
 * Utiliza navigator.vibrate con patrones de pulsación optimizados de corta duración.
 */

export type HapticPattern =
  | "selection" // Tap sutil para botones o navegación (8ms)
  | "light"     // Confirmación liviana (12ms)
  | "medium"    // Acción moderada, ej. marcar serie completa (20ms)
  | "heavy"     // Guardar sesión o comida (35ms)
  | "success"   // Patrón doble para logro o meta diaria [15ms, 40ms, 25ms]
  | "warning";  // Advertencia suave [30ms, 50ms, 15ms]

const PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 8,
  light: 12,
  medium: 20,
  heavy: 35,
  success: [15, 40, 25],
  warning: [30, 50, 15],
};

export function triggerHaptic(pattern: HapticPattern = "selection"): boolean {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return false;
  }

  // Respetar preferencia de reducción de movimiento si aplica a háptica
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  try {
    const sequence = PATTERNS[pattern];
    return navigator.vibrate(sequence);
  } catch {
    // Si el navegador bloquea la vibración sin interacción previa, ignorar silenciosamente
    return false;
  }
}
