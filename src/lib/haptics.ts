/**
 * Módulo de retroalimentación táctil (Háptica) para experiencia móvil premium.
 * Utiliza navigator.vibrate con patrones de pulsación optimizados de corta duración.
 *
 * iPhone no tiene navigator.vibrate. Desde iOS 18, Safari da un toque háptico
 * del sistema al cambiar un interruptor nativo (`<input type="checkbox"
 * switch>`); se activa uno invisible desde el mismo toque del usuario. Ahí no
 * hay patrones: todos suenan como un toque del sistema.
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

/** El toque del sistema en iOS 18+, con un interruptor nativo invisible. */
function iosSwitchTap(): boolean {
  if (!window.matchMedia?.("(pointer: coarse)").matches) return false;
  try {
    const label = document.createElement("label");
    label.ariaHidden = "true";
    label.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    label.remove();
    return true;
  } catch {
    return false;
  }
}

export function triggerHaptic(pattern: HapticPattern = "selection"): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Respetar preferencia de reducción de movimiento si aplica a háptica
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  if (!("vibrate" in navigator)) {
    return iosSwitchTap();
  }

  try {
    const sequence = PATTERNS[pattern];
    return navigator.vibrate(sequence);
  } catch {
    // Si el navegador bloquea la vibración sin interacción previa, ignorar silenciosamente
    return false;
  }
}
