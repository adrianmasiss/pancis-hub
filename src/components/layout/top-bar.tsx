import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";

/**
 * Barra superior del handoff: conmutador de tema y acceso al copiloto,
 * alineados a la derecha sobre el lienzo.
 *
 * No es decoracion. Hasta ahora este componente existia y NADIE lo montaba, y
 * con el se habian perdido las dos funciones que contiene: no habia forma de
 * cambiar de tema ni de abrir el asistente desde la interfaz.
 *
 * La marca solo aparece en telefono: en escritorio ya la lleva el riel, y
 * repetirla era decir lo mismo dos veces en la misma pantalla.
 */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-5 sm:px-7 md:h-[4.5rem] md:justify-end md:pr-[calc(1.75rem+var(--copilot-gutter))] lg:pr-[calc(2.75rem+var(--copilot-gutter))] lg:pl-11">
      <span className="md:hidden" aria-hidden="true">
        <BrandLogo variant="mark" height={28} />
      </span>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />

        <Link
          href="/asistente"
          className="border-border-strong bg-card/70 text-foreground hover:bg-card focus-visible:ring-ring flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors duration-[var(--dur-fast)] focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
        >
          <Sparkles className="text-primary size-4" aria-hidden="true" />
          {messages.nav.assistant}
        </Link>
      </div>
    </header>
  );
}
