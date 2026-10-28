/**
 * Acento de la vista movil, elegible en Perfil. Solo afecta al telefono:
 * escritorio sigue con su paleta.
 *
 * El naranja era el de la paleta Pancis (#F0793F); en oct 27 el usuario lo
 * cambio a #FF4829, mas encendido. Escritorio sigue con el suyo.
 *
 * `fill` es el color de relleno (boton principal, pildora activa) y lleva
 * `onFill` encima (#111113 salvo que el relleno sea oscuro). `inkLight` es el
 * acento usado COMO texto en claro: el relleno no llega a 4.5:1 sobre blanco,
 * asi que se oscurece. `lineDark` es el acento como linea, borde, trazo o
 * texto sobre fondo oscuro; solo hace falta cuando el relleno es tan oscuro
 * que no se veria (el violeta #420D4B que eligio el usuario en oct 27).
 */
type AccentDef = {
  label: string;
  fill: string;
  inkLight: string;
  onFill?: string;
  lineDark?: string;
};

export const MOBILE_ACCENTS = {
  naranja: { label: "Naranja", fill: "#FF4829", inkLight: "#C42A12" },
  lima: { label: "Lima", fill: "#D4FF3A", inkLight: "#4A6400" },
  amarillo: { label: "Amarillo", fill: "#FFD60A", inkLight: "#7A5E00" },
  violeta: {
    label: "Violeta",
    fill: "#420D4B",
    inkLight: "#420D4B",
    onFill: "#F4F4F1",
    lineDark: "#CF8FDC",
  },
} as const satisfies Record<string, AccentDef>;

export type MobileAccent = keyof typeof MOBILE_ACCENTS;

export const MOBILE_ACCENT_COOKIE = "pc-m-accent";
export const DEFAULT_MOBILE_ACCENT: MobileAccent = "naranja";

export function isMobileAccent(value: unknown): value is MobileAccent {
  return typeof value === "string" && value in MOBILE_ACCENTS;
}

/** Variables CSS del acento, para el `style` de `.m-app`. */
export function accentVars(accent: MobileAccent): Record<string, string> {
  const a: AccentDef = MOBILE_ACCENTS[accent];
  return {
    "--m-accent": a.fill,
    "--m-accent-ink-light": a.inkLight,
    "--m-on-accent": a.onFill ?? "#111113",
    "--m-accent-line-dark": a.lineDark ?? a.fill,
    /* En claro, el relleno ya se ve como linea (si es muy claro, los textos
       usan `inkLight`). */
    "--m-accent-line-light": a.fill,
  };
}
