"use client";

import Link from "next/link";
import { markNav } from "@/mobile/nav-direction";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_NAV, isActiveMobileRoute } from "@/mobile/routes";

/**
 * Barra inferior flotante: capsula de vidrio a 16px de los bordes y 18px del
 * fondo. Una sola pildora del acento vive en la grilla y se desliza con
 * `translateX(indice × 100%)`: un resorte que se puede interrumpir y que sale
 * al tocar, sin esperar a que cargue la pestaña.
 */
export function GlassTabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const current = MOBILE_NAV.findIndex(({ href }) =>
    isActiveMobileRoute(pathname, href),
  );
  /* La pestaña tocada, hasta que la ruta la alcanza. */
  const [tapped, setTapped] = useState<{ from: string; index: number } | null>(
    null,
  );
  const index = tapped && tapped.from === pathname ? tapped.index : current;

  return (
    <div className="m-tabbar-wrap">
      <nav aria-label="Principal" className="m-tabbar">
        <motion.span
          className="m-tabbar-pill"
          aria-hidden="true"
          initial={false}
          animate={{
            x: `${Math.max(0, index) * 100}%`,
            opacity: index < 0 ? 0 : 1,
          }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  x: { type: "spring", bounce: 0.18, duration: 0.5 },
                  opacity: { duration: 0.2 },
                }
          }
        />
        {MOBILE_NAV.map(({ href, label, icon: Icon }, i) => {
          const active = i === index;
          return (
            <Link
              key={href}
              href={href}
              /* Las cinco pestañas con sus datos, no solo hasta el esqueleto:
                 cambiar de pestaña es instantaneo. Guardar algo llama a
                 `revalidatePath`, que descarta lo precargado. */
              prefetch
              aria-current={i === current ? "page" : undefined}
              data-active={active ? "" : undefined}
              onClick={() => {
                markNav("tab");
                triggerHaptic("selection");
                if (i !== current) setTapped({ from: pathname, index: i });
              }}
              className="m-tabbar-item"
            >
              <motion.span
                className="m-tabbar-icon"
                aria-hidden="true"
                initial={false}
                animate={{ scale: active ? 1.08 : 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", bounce: 0.35, duration: 0.45 }
                }
              >
                <Icon size={20} strokeWidth={2} />
              </motion.span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
