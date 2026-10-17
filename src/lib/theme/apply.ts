import {
  PALETTES,
  PALETTE_TOKENS,
  TOKEN_CSS_VAR,
  type PaletteMode,
  type PaletteName,
} from "@/lib/theme/palettes";

export const PALETTE_STORAGE_KEY = "pancis-palette-v2";
export const MODE_STORAGE_KEY = "pancis-theme";

/**
 * Copia del tema en cookies, que es la unica forma de que el SERVIDOR sepa
 * en que modo va la persona.
 *
 * Sin esto el servidor rinde siempre el modo por defecto y el cliente lo
 * corrige despues de hidratar: medido, ~175 ms con la clase `dark` puesta
 * antes de saltar a claro. Quien usa modo claro veia un destello oscuro en
 * CADA carga. Y el mismo desfase hacia que `aria-pressed` del conmutador no
 * coincidiera entre servidor y cliente, que React avisa como
 * "this won't be patched up": el atributo se quedaba mal para un lector de
 * pantalla hasta el siguiente render.
 *
 * Se guardan las dos cosas porque son distintas: la PREFERENCIA puede ser
 * "system", y el MODO resuelto no. El servidor necesita el modo para pintar
 * los atributos, y la preferencia para que el conmutador rinda igual en los
 * dos lados.
 */
export const THEME_PREFERENCE_COOKIE = "pancis-theme-pref";
export const THEME_MODE_COOKIE = "pancis-theme-mode";

/** Un ano. Sin `Secure` porque en desarrollo se sirve por http. */
const COOKIE_ATTRS = "; path=/; max-age=31536000; samesite=lax";

export function storeThemeCookies(
  preference: string,
  mode: PaletteMode,
  palette: PaletteName,
): void {
  try {
    document.cookie = `${THEME_PREFERENCE_COOKIE}=${preference}${COOKIE_ATTRS}`;
    document.cookie = `${THEME_MODE_COOKIE}=${mode}${COOKIE_ATTRS}`;
    document.cookie = `${PALETTE_STORAGE_KEY}=${palette}${COOKIE_ATTRS}`;
  } catch {
    // Un navegador puede rechazar cookies; el tema sigue funcionando por
    // localStorage, solo vuelve el parpadeo.
  }
}

/**
 * La paleta que arranca la app. Cambiarla aqui cambia el producto entero.
 *
 * Pancis es la identidad principal. La clave v2 adopta la nueva identidad
 * una sola vez; Gilded sigue disponible como selección explícita de respaldo.
 */
export const DEFAULT_PALETTE: PaletteName = "Pancis";
export const DEFAULT_MODE: PaletteMode = "dark";

/**
 * Escribe los diecinueve tokens en `documentElement` y marca el elemento con
 * `data-pc`. Ese atributo es lo que activa el puente de `globals.css`: hasta
 * que existe, la hoja sirve los valores literales del sistema anterior, asi
 * que no hay un parpadeo de colores sin resolver antes de la hidratacion.
 */
export function applyPalette(
  palette: PaletteName,
  mode: PaletteMode,
  root: HTMLElement = document.documentElement,
): void {
  const scheme = PALETTES[palette][mode];

  for (const token of PALETTE_TOKENS) {
    root.style.setProperty(TOKEN_CSS_VAR[token], scheme[token]);
  }

  root.dataset.pc = palette;
  root.dataset.pcMode = mode;
  root.style.colorScheme = mode;
  root.classList.toggle("dark", mode === "dark");
}
