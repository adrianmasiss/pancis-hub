import localFont from "next/font/local";

/**
 * Tipografia de la vista movil: Manrope para la interfaz y Saira solo para
 * cifras. Locales y variables (un archivo por familia, subconjunto latin)
 * porque DESIGN.md prohibe fuentes remotas que aten el build a la red.
 */
export const manrope = localFont({
  variable: "--m-font-ui",
  display: "swap",
  src: [
    {
      path: "../app/fonts/Manrope-Variable.woff2",
      weight: "400 800",
      style: "normal",
    },
  ],
});

export const saira = localFont({
  variable: "--m-font-num",
  display: "swap",
  src: [
    {
      path: "../app/fonts/Saira-Variable.woff2",
      weight: "500 700",
      style: "normal",
    },
  ],
});
