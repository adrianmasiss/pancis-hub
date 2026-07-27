"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";
import { isActiveRoute, navItems } from "@/lib/navigation";

/**
 * Barra superior, con el tratamiento del handoff v2: pegajosa, fondo
 * translucido con desenfoque y regla divisoria abajo.
 *
 * Del bloque derecho del handoff no se implementan el buscador con ⌘K ni la
 * campana de notificaciones: son funciones que el producto no tiene y que el
 * propio handoff deja como "aun no implementado, definir en la implementacion
 * real". Poner el hueco visual sin la funcion detras seria decorado.
 */
export function TopBar({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();
  const current = navItems.find((item) => isActiveRoute(pathname, item.href));

  return (
    <header className="border-divider surface-bar sticky top-0 z-30 border-b">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-5 sm:h-16 sm:px-7 lg:px-10 xl:px-12">
        {/* En movil el logo sustituye al riel lateral como ancla de marca. */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="lg:hidden" aria-hidden="true">
            <BrandLogo height={26} />
          </span>
          {/* El handoff pone aqui el titulo de 26px/800, porque en su prototipo
              la pantalla no tiene otro. En el repo cada pagina ya abre con un
              PageHeader (titulo, descripcion, icono y acciones) justo debajo,
              asi que subir esta linea a esa escala dejaba el mismo texto dos
              veces y en dos tamanos grandes. La escala de display se queda en
              el PageHeader, que es quien lleva el contexto completo; aqui la
              linea vuelve a ser una referencia de ubicacion. */}
          <p className="truncate text-[0.9375rem] font-medium tracking-[-0.015em] sm:text-base">
            {current ? messages.nav[current.labelKey] : messages.app.name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}
