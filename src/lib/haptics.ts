/**
 * Módulo de retroalimentación táctil (Háptica) para experiencia móvil premium.
 * Utiliza navigator.vibrate con patrones de pulsación optimizados de corta duración.
 *
 * iPhone no tiene navigator.vibrate y no deja vibrar por código: solo vibra
 * cuando el dedo toca un interruptor nativo. Eso lo hace <Haptic />
 * (src/mobile/ui/haptic.tsx), puesto dentro de cada botón que debe vibrar.
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
  if (typeof window === "undefined") {
    return false;
  }

  /* «Reducir movimiento» no apaga la vibracion: en iPhone mucha gente lo
     tiene activo y dejaba la app sin ningun toque. */

  // iPhone no tiene navigator.vibrate: ahi vibra <Haptic /> (mobile/ui/haptic).
  if (!("vibrate" in navigator)) {
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
