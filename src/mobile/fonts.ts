import localFont from "next/font/local";

/**
 * Tipografia de la vista movil: Manrope para la interfaz y las cifras. Locales y variables (un archivo por familia, subconjunto latin)
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
