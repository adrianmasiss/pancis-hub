"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { messages } from "@/i18n/es-419";

/**
 * Acceso flotante al asistente desde cualquier pantalla
 * (docs/02_PRODUCT_REQUIREMENTS.md 15).
 *
 * Se oculta en la propia pagina del asistente, donde seria redundante, y
 * se coloca por encima de la barra inferior en movil para no taparla.
 */
export function AssistantFab() {
  const pathname = usePathname();
  if (pathname.startsWith("/asistente")) return null;

  return (
    <Link
      href="/asistente"
      aria-label={messages.assistant.openAssistant}
      /*
        Se apoya por encima de la barra inferior, que ahora ocupa todo el ancho
        y esta anclada al borde: antes flotaba sobre ella y tapaba un objetivo.
      */
      className="bg-primary text-primary-foreground hover:bg-primary/88 focus-visible:ring-ring focus-visible:ring-offset-background surface-overlay fixed right-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex size-12 items-center justify-center rounded-full border-0 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none lg:right-8 lg:bottom-8"
    >
      <Sparkles className="size-5" aria-hidden="true" />
    </Link>
  );
}
