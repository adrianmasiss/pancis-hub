import { signOut } from "@/features/auth/actions";

/**
 * Cerrar sesion desde un boton: da de baja la suscripcion push de ESTE
 * dispositivo antes de salir, para que no le sigan llegando avisos. Si el
 * navegador no tiene push, sale igual.
 */
export async function signOutDevice(): Promise<void> {
  let endpoint: string | undefined;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      endpoint = sub.endpoint;
      await sub.unsubscribe();
    }
  } catch {
    /* Sin service worker no hay suscripcion que olvidar. */
  }
  await signOut(endpoint);
}
