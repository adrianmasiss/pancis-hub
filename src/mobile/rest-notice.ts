/** Preferencia del aviso de fin de descanso, guardada en este telefono. */
export const REST_NOTICE_KEY = "pancis:aviso-descanso";

/**
 * Avisa que termino el descanso cuando la app no esta a la vista (el
 * telefono en el bolsillo o en otra app). Es un aviso local del service
 * worker: no pasa por el servidor. Si la app esta a la vista, basta el
 * toast y la vibracion de la sesion.
 *
 * Limite del navegador: con la app suspendida (iPhone con la pantalla
 * apagada) el temporizador no corre y el aviso llega al volver.
 */
export async function notifyRestEnd(): Promise<void> {
  if (typeof document === "undefined" || document.visibilityState !== "hidden")
    return;
  try {
    if (localStorage.getItem(REST_NOTICE_KEY) === "0") return;
  } catch {
    /* Sin almacenamiento vale el valor por defecto: encendido. */
  }
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  const reg = await navigator.serviceWorker?.getRegistration();
  await reg?.showNotification("¡A la siguiente serie!", {
    body: "Terminó tu descanso.",
    tag: "pancis-descanso",
    icon: "/icons/icon-192.png",
    data: { url: location.pathname + location.search },
  });
}
