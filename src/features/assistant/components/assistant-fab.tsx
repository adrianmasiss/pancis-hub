"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { messages } from "@/i18n/es-419";

/**
 * Rutas donde el flotante no aparece.
 *
 * En el asistente seria redundante. En Hoy estorba: la maqueta pone ahi un
 * boton prominente a ancho completo pegado al borde inferior, y el flotante le
 * cae encima del extremo derecho — no solo se ve mal, roba el toque. Un acceso
 * permanente no puede taparle el objetivo a la accion de la pantalla.
 *
 * El asistente sigue a un toque desde el resto de las pantallas y desde "Mas".
 */
const HIDDEN_ON = ["/asistente", "/"];

/**
 * Acceso flotante al asistente (docs/02_PRODUCT_REQUIREMENTS.md 15).
 * Se coloca por encima de la barra inferior en movil para no taparla.
 */
export function AssistantFab() {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );

  /*
    Marca la raiz para que `globals.css` reserve —o no— el pasillo de 74px a la
    derecha del contenido. La decision vive aqui porque este componente es el
    unico que sabe si el flotante se rinde; el shell es de servidor y no puede
    saberlo. El efecto corre siempre, tambien cuando no se rinde nada: si solo
    corriera al mostrarse, el pasillo se quedaria puesto al navegar a Hoy.
  */
  useEffect(() => {
    document.documentElement.dataset.copilot = hidden ? "off" : "on";
  }, [hidden]);

  if (hidden) {
    return null;
  }

  return (
    <Link
      href="/asistente"
      aria-label={messages.assistant.openAssistant}
      /*
        Se apoya por encima de la barra inferior, que ocupa todo el ancho y esta
        anclada al borde: antes flotaba sobre ella y tapaba un objetivo. La
        respuesta va al pulsar, no al soltar.

        Lleva sombra (`--shadow-lifted`, la unica fuera de las capas flotantes)
        porque es lo unico del sistema que se mueve sobre contenido arbitrario:
        aqui no hay tono al que saltar, asi que la elevacion no puede hacerla el
        tono como en el resto.
      */
      className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-offset-background fixed right-8 bottom-8 z-40 hidden size-12 items-center justify-center rounded-2xl border border-white/10 shadow-[var(--shadow-lifted)] transition-[background-color,transform] duration-[var(--dur-fast)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.94] md:flex"
    >
      <Sparkles
        className="text-primary size-5"
        strokeWidth={2}
        aria-hidden="true"
      />
    </Link>
  );
}
