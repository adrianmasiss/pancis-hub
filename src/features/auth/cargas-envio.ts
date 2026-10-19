/**
 * Que se ve mientras el formulario envia. Tres candidatos para elegir uno.
 *
 *   actual     el boton se encoge a un disco de marca con los puntos dentro
 *   puntos     los mismos puntos, sin disco: solo ellos, como en la entrada
 *   pantalla   la pantalla de carga entera, la misma que abre la sesion
 *
 * El elegido se escribe como `data-carga-envio` en `<html>`, y de ahi en
 * adelante NO hay logica: las dos variantes son CSS puro sobre el estado que
 * el formulario ya publica (`aria-busy` en su boton, que es lo que un lector
 * de pantalla usa para anunciar la espera). Por eso ni `login-form` ni
 * `register-form` se enteran de esto: no se toca el camino del envio para
 * poder mirarlo.
 */
export type CargaEnvio = { slug: string; rotulo: string };

export const cargasDelEnvio: CargaEnvio[] = [
  { slug: "puntos", rotulo: "Solo puntos" },
  { slug: "actual", rotulo: "Con fondo" },
  { slug: "pantalla", rotulo: "Pantalla de carga" },
];

export const CLAVE_CARGA_ENVIO = "pancis:carga-envio";

/** El atributo en `<html>`, en las dos formas en que hace falta nombrarlo. */
export const ATRIBUTO_CARGA_ENVIO = "data-carga-envio";
export const DATASET_CARGA_ENVIO = "cargaEnvio";
