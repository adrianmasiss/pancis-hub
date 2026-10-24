/**
 * Acento de la vista movil, elegible en Perfil. Solo afecta al telefono:
 * escritorio sigue con su paleta.
 *
 * El naranja es el de la paleta Pancis (#F0793F), no el #F26B3A de la
 * referencia: el usuario pidio conservar nuestros colores.
 *
 * `fill` es el color de relleno (boton principal, pildora activa, anillos) y
 * siempre lleva texto #111113 encima. `ink` es el acento usado COMO texto: en
 * claro el relleno no llega a 4.5:1 sobre blanco, asi que se oscurece.
 */
export const MOBILE_ACCENTS = {
  naranja: { label: "Naranja", fill: "#F0793F", inkLight: "#B8461A" },
  lima: { label: "Lima", fill: "#D4FF3A", inkLight: "#4A6400" },
  amarillo: { label: "Amarillo", fill: "#FFD60A", inkLight: "#7A5E00" },
  violeta: { label: "Violeta", fill: "#8B6CFF", inkLight: "#5B3FD6" },
} as const;

export type MobileAccent = keyof typeof MOBILE_ACCENTS;

export const MOBILE_ACCENT_COOKIE = "pc-m-accent";
export const DEFAULT_MOBILE_ACCENT: MobileAccent = "naranja";

export function isMobileAccent(value: unknown): value is MobileAccent {
  return typeof value === "string" && value in MOBILE_ACCENTS;
}

/** Variables CSS del acento, para el `style` de `.m-app`. */
export function accentVars(accent: MobileAccent): Record<string, string> {
  const a = MOBILE_ACCENTS[accent];
  return {
    "--m-accent": a.fill,
    "--m-accent-ink-light": a.inkLight,
  };
}
