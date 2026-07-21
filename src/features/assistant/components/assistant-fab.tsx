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
      className="bg-brand-button text-primary-foreground focus-visible:ring-ring fixed right-4 bottom-20 z-40 flex size-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:outline-none md:bottom-6"
    >
      <Sparkles className="size-5" aria-hidden="true" />
    </Link>
  );
}
