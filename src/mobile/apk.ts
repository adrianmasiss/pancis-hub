/**
 * La app dentro del APK de Android (carpeta android/, una Trusted Web
 * Activity). El APK abre `/?origen=apk`; la primera carga lo anota aqui para
 * el resto de la sesion y las siguientes.
 */
const MARCA = "pc-apk";

export function anotarSiEsApk() {
  try {
    const desdeApk =
      new URLSearchParams(location.search).get("origen") === "apk" ||
      document.referrer.startsWith("android-app://com.pancishub.app");
    if (desdeApk) localStorage.setItem(MARCA, "1");
  } catch {
    // Sin almacenamiento no se cambia el icono; la app sigue igual.
  }
}

function esApk() {
  try {
    return localStorage.getItem(MARCA) === "1";
  } catch {
    return false;
  }
}

/**
 * Pide al APK que cambie el icono del lanzador al acento. Lo atiende
 * IconoActivity (pancis://icono/<acento>); en el navegador no hace nada.
 */
export function cambiarIconoApk(acento: string) {
  if (esApk()) location.href = `pancis://icono/${acento}`;
}

/** El icono que iOS copia al «Agregar a inicio», ya en el acento nuevo. */
export function cambiarIconoIphone(acento: string) {
  const link = document.querySelector<HTMLLinkElement>(
    'link[rel="apple-touch-icon"]',
  );
  if (link) link.href = `/icons/acento/${acento}-180.png`;
}
