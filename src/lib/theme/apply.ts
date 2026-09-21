import {
  PALETTES,
  PALETTE_TOKENS,
  TOKEN_CSS_VAR,
  type PaletteMode,
  type PaletteName,
} from "@/lib/theme/palettes";

export const PALETTE_STORAGE_KEY = "pancis-palette";
export const MODE_STORAGE_KEY = "pancis-theme";

/**
 * La paleta que arranca la app. Cambiarla aqui cambia el producto entero.
 *
 * Gilded es la canonica del handoff: la que define la identidad y con la que
 * se juzga cualquier pantalla nueva. Las otras siete son temas que la persona
 * elige en Configuracion.
 */
export const DEFAULT_PALETTE: PaletteName = "Gilded";
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
