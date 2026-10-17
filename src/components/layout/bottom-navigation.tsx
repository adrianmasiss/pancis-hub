"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { messages } from "@/i18n/es-419";
import { bottomNavItems, isActiveRoute } from "@/lib/navigation";
import { triggerHaptic } from "@/lib/haptics";
import "./bottom-navigation.css";

/**
 * Navegacion inferior movil: una capsula flotante de circulos (referencia del
 * usuario, oct 2026).
 *
 * Cada destino es un circulo de 52px, objetivo tactil holgado. El activo es
 * un disco naranja que se DESLIZA de una pestana a la otra al navegar (un
 * solo elemento con `layoutId`, no cuatro que se encienden y apagan): el
 * movimiento dice de donde vienes y adonde fuiste.
 *
 * Los inactivos van sin rotulo, como en la referencia; el activo se alarga y
 * dice donde estas, para que quitar los rotulos no cueste la orientacion.
 * Todos llevan su nombre como etiqueta accesible y como `title`.
 *
 * Solo telefono: desde 768px manda el riel lateral.
 */
export function BottomNavigation() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav aria-label={messages.common.mainNavigation} className="dock">
      <ul>
        {bottomNavItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          const label = messages.nav[item.bottomNavLabelKey ?? item.labelKey];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => triggerHaptic("selection")}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                className="dock-tab"
                data-active={active ? "" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="dock-active"
                    className="dock-active"
                    aria-hidden="true"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", bounce: 0.18, duration: 0.42 }
                    }
                  />
                )}
                <Icon
                  className="dock-icon"
                  strokeWidth={active ? 2.1 : 1.7}
                  aria-hidden="true"
                />
                <span className="dock-label" aria-hidden="true">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
