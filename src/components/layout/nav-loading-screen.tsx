"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { messages } from "@/i18n/es-419";

/**
 * La pantalla de carga de la entrada, tambien al cambiar de seccion.
 *
 * Dos decisiones que la hacen util en vez de molesta:
 *
 *  1. TARDA EN APARECER. Si la pantalla siguiente llega antes del umbral, no
 *     se ve nada. Una cortina que parpadea 80ms es peor que ninguna cortina:
 *     el ojo la registra como un fallo, no como una espera. Solo aparece
 *     cuando la espera es real.
 *  2. SE APAGA AL LLEGAR, no al terminar de cargar. En cuanto la ruta nueva
 *     entra, manda su propio esqueleto —el `loading.tsx` de cada seccion, que
 *     reserva la geometria real—. Quedarse encima taparia justo eso.
 *
 * Escucha los clics en vez de envolver cada enlace: la navegacion sale del
 * riel, de la barra inferior, de las tarjetas y del menu, y con `useLinkStatus`
 * habria que tocarlos todos. Un oyente en captura los cubre sin que ninguno
 * tenga que saber de esto.
 */

/** Por debajo de esto, la espera no se anuncia: se aguanta. */
const UMBRAL_MS = 180;

/** Si la navegacion se queda a medias (cancelada, error), no dejar cortina. */
const TECHO_MS = 6000;

export function NavLoadingScreen() {
  const pathname = usePathname();
  /* Lo que se guarda es la ruta DESDE la que se pulso, no un booleano: asi
     "¿hay que mostrar la cortina?" se deduce en el render comparando con la
     ruta actual, y cuando la nueva entra se apaga sola. Un booleano habria
     necesitado apagarlo desde un efecto, que es justo lo que React pide no
     hacer —y lo que el linter no deja—. */
  const [esperando, setEsperando] = useState<string | null>(null);
  const temporizadores = useRef<number[]>([]);

  const limpiar = () => {
    for (const id of temporizadores.current) window.clearTimeout(id);
    temporizadores.current = [];
  };

  useEffect(() => {
    const alPulsar = (evento: MouseEvent) => {
      /* Solo un clic primario y limpio: con Cmd, Ctrl o Shift el navegador
         abre en otra pestaña y esta no se mueve. */
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }
      const destino = (evento.target as HTMLElement | null)?.closest?.("a");
      if (!destino) return;
      if (destino.target && destino.target !== "_self") return;
      if (destino.hasAttribute("download")) return;

      const href = destino.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;

      const ruta = href.split("?")[0]?.split("#")[0];
      if (!ruta || ruta === window.location.pathname) return;

      const origen = window.location.pathname;
      limpiar();
      temporizadores.current.push(
        window.setTimeout(() => setEsperando(origen), UMBRAL_MS),
        window.setTimeout(() => setEsperando(null), TECHO_MS),
      );
    };

    document.addEventListener("click", alPulsar, true);
    return () => {
      document.removeEventListener("click", alPulsar, true);
      limpiar();
    };
  }, []);

  /* La ruta nueva ya esta montada: la cortina se retira sola y deja ver el
     esqueleto de la seccion. */
  if (esperando === null || esperando !== pathname) return null;

  return (
    <div
      className="app-loading"
      role="status"
      aria-label={messages.common.loading}
    >
      <BrandLogo variant="mark" height={78} />
      <BrandLogo variant="name" height={40} />
      <NewtonsCradle size={40} />
    </div>
  );
}
