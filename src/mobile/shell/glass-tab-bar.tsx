"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_NAV, isActiveMobileRoute } from "@/mobile/routes";

/**
 * Barra inferior flotante: capsula de vidrio a 16px de los bordes y 18px del
 * fondo. El activo lleva una pildora del acento que se DESLIZA entre items
 * (un solo elemento con `layoutId`), y el contenido se ve difuminado detras.
 */
export function GlassTabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <div className="m-tabbar-wrap">
      <nav aria-label="Principal" className="m-tabbar">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActiveMobileRoute(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => triggerHaptic("selection")}
              className="m-tabbar-item"
            >
              {active && (
                <motion.span
                  layoutId="m-tabbar-pill"
                  className="m-tabbar-pill"
                  aria-hidden="true"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          type: "tween",
                          duration: 0.45,
                          ease: [0.2, 0.8, 0.2, 1],
                        }
                  }
                />
              )}
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
