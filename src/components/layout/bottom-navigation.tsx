"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { messages } from "@/i18n/es-419";
import { bottomNavItems, isActiveRoute } from "@/lib/navigation";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Celda de la barra: icono arriba, rotulo debajo, sin caja propia.
 *
 * El objetivo tactil llega a 56px de alto y a un quinto del ancho, que en 390px
 * son 78px: de sobra para el pulgar y para el rotulo.
 */
const TAB_BASE =
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-[color,transform,background-color] duration-[var(--dur-fast)] active:scale-[0.94]";

const TAB_LABEL = "max-w-full truncate text-[0.625rem] leading-none";

/**
 * Navegacion inferior movil.
 *
 * Dock oscuro y flotante con cinco pestanas. Los rotulos siguen visibles: un
 * icono suelto obliga a adivinar el destino.
 *
 * El activo se marca SOLO con color y peso: el rotulo y el icono toman el
 * acento, y el trazo del icono engorda. Nada de pastilla detras — esa es la
 * firma de Material 3, y fue lo primero que delato el diseno como Android.
 *
 * (SF Symbols marcaria el activo con la variante rellena. lucide es un juego de
 * trazo sin variantes rellenas, asi que se usa el otro eje que Apple tambien
 * usa, el peso. Rellenar los glifos de lucide da resultados dispares: `Home`
 * cierra silueta, pero `Utensils` y `TrendingUp` son trazos abiertos y se
 * convierten en manchas.)
 */
export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={messages.common.mainNavigation}
      /*
        Solo telefono. Desde 768px manda el riel: el dock estirado a lo ancho
        de una tablet era una franja de 1024px con cinco iconos perdidos en
        ella.

        El fondo sale de `--sidebar`, no de un literal, para que siga a la
        paleta activa como el resto del sistema.
      */
      className="fixed inset-x-0 bottom-0 z-40 flex h-[78px] items-stretch border-t border-white/10 bg-[color-mix(in_oklab,var(--sidebar)_96%,transparent)] px-1.5 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {bottomNavItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        const Icon = item.icon;
        const label = messages.nav[item.bottomNavLabelKey ?? item.labelKey];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => triggerHaptic("selection")}
            aria-current={active ? "page" : undefined}
            className={cn(
              TAB_BASE,
              active ? "text-primary" : "text-white/55 hover:text-white/90",
            )}
          >
            <Icon
              className="size-[22px] shrink-0"
              strokeWidth={active ? 2.25 : 1.75}
              aria-hidden="true"
            />
            <span className={cn(TAB_LABEL, active && "font-semibold")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
