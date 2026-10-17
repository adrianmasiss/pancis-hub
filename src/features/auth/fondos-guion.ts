import { ID_HOJA_ACENTO } from "@/features/auth/acentos-acceso";
import {
  ATRIBUTO_CARGA_ENVIO,
  CLAVE_CARGA_ENVIO,
} from "@/features/auth/cargas-envio";
import {
  ATRIBUTO_ACENTO_TARJETA,
  CLAVE_ACENTO_TARJETA,
} from "@/features/nutrition/acentos-tarjeta";

/** Las variables y claves que escribe el selector, en un solo sitio. */
export const CLAVE_FONDO_LOGIN = "pancis:fondo-login";
export const CLAVE_FONDO_CARGA = "pancis:fondo-carga";
export const CLAVE_FONDO_SISTEMA = "pancis:fondo-sistema";
export const CLAVE_ACENTO = "pancis:acento";

export const VARIABLE_FONDO_LOGIN = "--login-foto";
export const VARIABLE_FONDO_CARGA = "--login-carga";
export const VARIABLE_FONDO_SISTEMA = "--app-fondo";

/**
 * Aplica lo elegido en el selector ANTES del primer pintado.
 *
 * Tiene que ir en linea y sin `defer` en los dos sitios donde se monta:
 *
 *  - En ACCESO, porque la pantalla de carga dura 3s y arranca sola con el
 *    documento: un `useEffect` llegaria tarde y el fondo cambiaria a mitad de
 *    la introduccion, que es justo lo que se esta juzgando.
 *  - En la APP, porque el fondo del sistema es lo primero que se ve: aplicarlo
 *    despues de hidratar seria un parpadeo del lienzo entero en cada carga.
 *
 * Es el mismo truco que evita el destello de tema claro al cargar, y por eso
 * el guion es uno solo y se comparte: dos copias se habrian separado.
 */
export const GUION_FONDOS = `try{var d=document.documentElement,a=localStorage.getItem('${CLAVE_FONDO_LOGIN}'),b=localStorage.getItem('${CLAVE_FONDO_CARGA}'),s=localStorage.getItem('${CLAVE_FONDO_SISTEMA}'),c=localStorage.getItem('${CLAVE_ACENTO}'),f=localStorage.getItem('${CLAVE_CARGA_ENVIO}'),t=localStorage.getItem('${CLAVE_ACENTO_TARJETA}');if(a)d.style.setProperty('${VARIABLE_FONDO_LOGIN}',a);if(b)d.style.setProperty('${VARIABLE_FONDO_CARGA}',b);if(s)d.style.setProperty('${VARIABLE_FONDO_SISTEMA}',s);if(f)d.setAttribute('${ATRIBUTO_CARGA_ENVIO}',f);if(t&&t!=='filete')d.setAttribute('${ATRIBUTO_ACENTO_TARJETA}',t);if(c){var h=document.createElement('style');h.id='${ID_HOJA_ACENTO}';h.textContent=c;document.head.appendChild(h)}}catch(e){}`;

/** El selector es una herramienta para decidir, no una funcion de la app. */
export const CON_SELECTOR =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_FONDOS === "1";
