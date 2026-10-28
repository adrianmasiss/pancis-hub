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

let iosSwitch: HTMLLabelElement | null = null;

/**
 * El toque del sistema en iOS 18+, con un interruptor nativo. Solo suena si
 * se llama dentro del toque del usuario (en el `onClick`, no despues de un
 * `await`). El interruptor vive en el `body` y se renderiza (fuera de
 * pantalla, transparente): con `display: none` WebKit no siempre lo cambia.
 */
function iosSwitchTap(): boolean {
  if (!window.matchMedia?.("(pointer: coarse)").matches) return false;
  try {
    if (!iosSwitch?.isConnected) {
      const label = document.createElement("label");
      label.ariaHidden = "true";
      label.style.cssText =
        "position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.tabIndex = -1;
      input.setAttribute("switch", "");
      label.appendChild(input);
      document.body.appendChild(label);
      iosSwitch = label;
    }
    iosSwitch.click();
    return true;
  } catch {
    return false;
  }
}

export function triggerHaptic(pattern: HapticPattern = "selection"): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  /* «Reducir movimiento» no apaga la vibracion: en iPhone mucha gente lo
     tiene activo y dejaba la app sin ningun toque. */

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
