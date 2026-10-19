import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "./icon-tabs.css";

export type IconTabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

/**
 * Pestañas de sección como discos: la activa lleva el disco naranja y su
 * nombre desplegado al lado; las demás sólo muestran el icono y abren el
 * nombre al pasar el puntero (con una pausa corta, para que barrer la barra
 * con el ratón no la haga temblar) o al enfocarlas con el teclado.
 *
 * El nombre está siempre en el DOM —plegado, no oculto—, así que el enlace
 * conserva su nombre accesible. Sin "use client": todo es CSS.
 */
export function IconTabs({
  items,
  label,
  className,
  scroll,
}: {
  items: readonly IconTabItem[];
  /** Nombre accesible del grupo. */
  label: string;
  className?: string;
  /** `false` para cambiar de vista sin volver arriba (misma página). */
  scroll?: boolean;
}) {
  return (
    <nav aria-label={label} className={cn("icon-tabs", className)}>
      {items.map(({ href, label: name, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          scroll={scroll}
          className="icon-tab"
          aria-current={active ? "page" : undefined}
          title={active ? undefined : name}
        >
          <span className="icon-tab-disc" aria-hidden="true">
            <Icon size={17} strokeWidth={2.1} />
          </span>
          <span className="icon-tab-label">
            <span>
              <span>{name}</span>
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
