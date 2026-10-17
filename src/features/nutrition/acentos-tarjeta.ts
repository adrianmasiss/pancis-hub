/**
 * Cómo lleva el acento una tarjeta destacada de Nutrición. Tres candidatos
 * para mirarlos en la pantalla real y quedarse con uno.
 *
 *   filete    carbón mate y el borde cónico del v11 teñido de turquesa; el
 *             color vive solo en el perímetro y en un tinte casi invisible
 *   solido    la tarjeta ENTERA en turquesa, tinta oscura encima y un filete
 *             básico del color del lienzo para recortarla contra el fondo
 *   vidrio    turquesa translúcido con desenfoque detrás y un filo claro
 *             arriba, como el material de una barra flotante
 *   naranja   vidrio naranja en las cuatro del resumen
 *   degradado el degradado ámbar→carmín del usuario, a opacidad sobre la base
 *             oscura: en bruto va de muy claro a muy oscuro y ningún color de
 *             texto pasa en los dos extremos
 *   blanco    tarjeta blanca con filete negro y las esquinas encendidas en
 *             naranja
 *
 * El elegido se escribe como `data-acento-tarjeta` en `<html>` y de ahí en
 * adelante NO hay lógica: las tres variantes son CSS puro sobre las mismas
 * dos tarjetas. Por eso ningún componente de Nutrición se entera de esto —
 * no se toca el código de la pantalla para poder mirarla.
 *
 * Solo alcanza a DOS tarjetas, las mismas en los tres casos: Calorías y
 * Sustituto rápido. La comparación es del tratamiento, no de cuántas lo
 * llevan.
 */
export type AcentoTarjeta = { slug: string; rotulo: string };

export const acentosDeTarjeta: AcentoTarjeta[] = [
  { slug: "filete", rotulo: "Filete" },
  { slug: "solido", rotulo: "Sólido" },
  { slug: "vidrio", rotulo: "Vidrio" },
  { slug: "naranja", rotulo: "Naranja" },
  { slug: "degradado", rotulo: "Degradado" },
  { slug: "blanco", rotulo: "Blanco" },
];

export const CLAVE_ACENTO_TARJETA = "pancis:acento-tarjeta";

/** El atributo en `<html>`, en las dos formas en que hace falta nombrarlo. */
export const ATRIBUTO_ACENTO_TARJETA = "data-acento-tarjeta";
export const DATASET_ACENTO_TARJETA = "acentoTarjeta";
