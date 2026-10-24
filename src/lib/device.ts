import { cookies, headers } from "next/headers";

/**
 * Cookie que fuerza una vista: `movil` o `escritorio`. Sirve para probar la
 * version de telefono desde un ordenador y como salida si la deteccion falla.
 */
export const VIEW_COOKIE = "pc-vista";

/** iPhone, iPod y Android "Mobile" (los Android sin "Mobile" son tabletas). */
const PHONE_UA = /iPhone|iPod|Android.+Mobile|Windows Phone/i;

/**
 * ¿La peticion viene de un telefono?
 *
 * Decide en el servidor que capa se rinde: la movil tiene su propio diseño
 * (pestañas, sheets, pantallas completas) y no es escritorio apilado. Un iPad
 * cuenta como escritorio. Una ventana de escritorio estrecha tambien: esa
 * sigue con `movil.css`.
 */
export async function isPhone(): Promise<boolean> {
  const jar = await cookies();
  const forced = jar.get(VIEW_COOKIE)?.value;
  if (forced === "movil") return true;
  if (forced === "escritorio") return false;

  const h = await headers();
  if (PHONE_UA.test(h.get("user-agent") ?? "")) return true;
  // Client hint de Chromium: "?1" en telefono. Safari no lo envia.
  return h.get("sec-ch-ua-mobile") === "?1";
}
