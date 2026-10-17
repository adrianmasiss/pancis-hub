/**
 * Los acentos candidatos del selector, para verlos por separado.
 *
 * Los dos que mando el usuario son DEGRADADOS (Gradient 04 y 05 de su
 * captura), no colores planos, y eso obliga a llevar las dos cosas por
 * candidato:
 *
 *   marca    la rampa entera, tal cual la muestra. Va donde un degradado se
 *            puede pintar de verdad: el isotipo y el logotipo, que son
 *            mascaras sobre un `background`.
 *   accion   el tramo LEGIBLE de esa misma rampa, para el boton. La rampa
 *            entera baja hasta #100C08: en un boton de 58px el pie queda casi
 *            negro y ningun color de texto se lee sobre los dos extremos a la
 *            vez, asi que la accion se queda con la parte alta.
 *   primary  el plano que reciben los sitios donde un degradado NO es un valor
 *            valido: `color`, `border-color`, el anillo de foco, los puntos
 *            del cargador. Es un tope de la rampa, no un color nuevo.
 *   strong   el mismo plano aclarado (hover, reverso). Se deja escrito como
 *            `color-mix` para que se vea de donde sale.
 *   fg       la tinta que va ENCIMA del acento.
 *
 * `null` es "el de la paleta": la opcion Actual no sustituye nada, solo retira
 * la sustitucion, y por eso es el punto de comparacion.
 */
export type AcentoCandidato = {
  slug: string;
  rotulo: string;
  color: {
    primary: string;
    strong: string;
    fg: string;
    marca: string;
    accion: string;
  } | null;
};

export const acentosDelProducto: AcentoCandidato[] = [
  { slug: "actual", rotulo: "Actual", color: null },
  {
    slug: "g04",
    rotulo: "Gradiente 04",
    color: {
      primary: "#FF9408",
      strong: "color-mix(in oklab, #FF9408 78%, #ffffff)",
      fg: "#1A0E04",
      marca:
        "linear-gradient(180deg, #FF9408 0%, #CA3F16 34%, #95122C 68%, #100C08 100%)",
      accion: "linear-gradient(180deg, #FF9408 0%, #CA3F16 100%)",
    },
  },
  {
    slug: "g05",
    rotulo: "Gradiente 05",
    color: {
      primary: "#95122C",
      strong: "color-mix(in oklab, #95122C 62%, #ffffff)",
      fg: "#FFF1F3",
      marca: "linear-gradient(180deg, #95122C 0%, #100C08 100%)",
      /* Un punto intermedio de SU rampa, no un color nuevo: la rampa entera
         llega a #100C08 y un boton mitad negro no se lee. */
      accion: "linear-gradient(180deg, #95122C 0%, #5D0B1C 100%)",
    },
  },
];

/**
 * La hoja que sustituye el acento. Tres decisiones dentro:
 *
 *  - `!important`. El proveedor de tema escribe los tokens de la paleta EN
 *    LINEA sobre `<html>` (`applyPalette`), y una declaracion en linea le gana
 *    a cualquier regla normal de hoja. `!important` de hoja de autor le gana a
 *    la de linea, asi que es lo unico que sobrevive a un cambio de tema.
 *  - El bloque de la tarjeta. Dentro de la tarjeta de acceso el naranja NO
 *    viene de la paleta: `.login-sheet` se fija sus propios `--primary` y
 *    `--ring` literales, asi que sustituir solo `--pc-primary` cambiaria el
 *    isotipo y los puntos de la carga y dejaria el boton como estaba.
 *  - El degradado NO puede ir en `--primary`. Ahi tambien lo leen `color:` y
 *    `border-color:`, y un `linear-gradient` en esas propiedades es un valor
 *    invalido: los enlaces de la tarjeta perderian su color. Por eso el
 *    degradado se pinta en las dos superficies que si son imagenes —la marca
 *    y el boton— y el resto recibe el plano.
 */
export function hojaDelAcento(color: NonNullable<AcentoCandidato["color"]>) {
  const { primary: p, strong: s, fg, marca, accion } = color;
  return (
    `:root{--pc-primary:${p}!important;--pc-primary-strong:${s}!important;` +
    `--pc-primary-fg:${fg}!important;--pc-brand-from:${p}!important;` +
    `--pc-brand-to:${s}!important}` +
    `html[data-pc] .login-stage,html[data-pc] .login-stage .login-sheet{` +
    `--primary:${p}!important;--primary-strong:${s}!important;` +
    `--primary-foreground:${fg}!important;--ring:${p}!important;` +
    `--brand-btn-from:${p}!important;--brand-btn-to:${s}!important}` +
    `.brand-artwork{--logo-paint:${marca}!important}` +
    /* El boton EN REPOSO. El que esta enviando se queda fuera a proposito:
       ahi manda la variante de carga que se este probando, y un degradado
       `!important` encima no dejaria ver ninguna. */
    `.login-sheet button[type="submit"]:not([aria-busy="true"]),` +
    `.login-sheet button[type="submit"]:hover:not(:disabled){` +
    `background:${accion}!important;color:${fg}!important}`
  );
}

/** El `<style>` es uno solo y se reutiliza: elegir otra vez reescribe su texto. */
export const ID_HOJA_ACENTO = "pancis-acento";
