"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";
import { isActiveRoute, navItems } from "@/lib/navigation";

/**
 * Barra superior. Deliberadamente escueta: identifica donde estas y deja el
 * resto del ancho al contenido. No aloja controles decorativos; cada accion que
 * aparece aqui llega desde la pagina a traves de `actions`.
 */
export function TopBar({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();
  const current = navItems.find((item) => isActiveRoute(pathname, item.href));

  return (
    <header className="border-hairline surface-bar sticky top-0 z-30 border-b">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-5 sm:h-16 sm:px-7 lg:px-10 xl:px-12">
        {/* En movil el logo sustituye al riel lateral como ancla de marca. */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="lg:hidden" aria-hidden="true">
            <BrandLogo height={26} />
          </span>
          <h1 className="truncate text-[0.9375rem] font-medium tracking-[-0.015em] sm:text-base">
            {current ? messages.nav[current.labelKey] : messages.app.name}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}
