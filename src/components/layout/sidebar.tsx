"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { messages } from "@/i18n/es-419";
import {
  homeNavItem,
  isActiveRoute,
  settingsNavItem,
  getSidebarSections,
  type NavLabelKey,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Entrada del riel, segun el handoff v2.
 *
 * Activo: pildora con degradado de acento, borde de acento al 40%, halo hacia
 * afuera y luz interior arriba, mas una barra de 3px pegada al borde
 * izquierdo. Reposo: transparente, texto atenuado. Transicion de 160ms.
 */
function NavLink({
  href,
  labelKey,
  icon: Icon,
  active,
}: {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-full border px-3.5 py-2.5 text-[13.5px] transition-colors duration-[160ms] ease-out [letter-spacing:0]",
        active
          ? "border-primary/40 text-foreground font-semibold"
          : "hover:bg-foreground/5 hover:text-foreground border-transparent font-medium text-[var(--muted-foreground)]",
      )}
      style={
        active
          ? {
              backgroundImage:
                "linear-gradient(180deg, color-mix(in oklch, var(--primary) 20%, transparent), color-mix(in oklch, var(--primary) 10%, transparent))",
              boxShadow:
                "0 0 20px -6px color-mix(in oklch, var(--primary) 50%, transparent), inset 0 1px 0 oklch(1 0 0 / 8%)",
            }
          : undefined
      }
    >
      {active ? (
        <span
          aria-hidden="true"
          className="bg-primary absolute inset-y-2 left-0 w-[3px] rounded-sm"
        />
      ) : null}
      <Icon
        className={cn("size-[18px] shrink-0", active && "text-primary")}
        aria-hidden="true"
      />
      <span className="truncate">{messages.nav[labelKey]}</span>
    </Link>
  );
}

type SidebarProps = {
  displayName?: string;
  avatarUrl?: string | null;
};

export function Sidebar({ displayName, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const sidebarSections = getSidebarSections();

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r lg:flex">
      {/* Bloque de marca: 66px de alto y regla divisoria, segun el handoff.
          Se conserva el logotipo real del producto en vez del monograma "P"
          del prototipo: la marca no se cambia sin permiso. */}
      <div className="border-divider flex h-[66px] shrink-0 items-center border-b px-5">
        <Link
          href="/"
          aria-label={messages.app.name}
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <BrandLogo height={30} />
        </Link>
      </div>

      <nav
        aria-label={messages.common.mainNavigation}
        className="flex flex-1 flex-col gap-px overflow-y-auto px-3 pt-1 pb-3"
      >
        <div className="flex flex-col gap-px">
          <NavLink
            href={homeNavItem.href}
            labelKey={homeNavItem.labelKey}
            icon={homeNavItem.icon}
            active={isActiveRoute(pathname, homeNavItem.href)}
          />
        </div>

        {sidebarSections.map((group) => (
          <div key={group.key} className="flex flex-col gap-px">
            {/* Etiqueta de grupo: 10px, 700, versalitas, tracking 1.1px. */}
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-[1.1px] text-[var(--subtle-foreground)] uppercase">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                labelKey={item.labelKey}
                icon={item.icon}
                active={isActiveRoute(pathname, item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-divider shrink-0 space-y-1 border-t px-3 py-3.5">
        <NavLink
          href={settingsNavItem.href}
          labelKey={settingsNavItem.labelKey}
          icon={settingsNavItem.icon}
          active={isActiveRoute(pathname, settingsNavItem.href)}
        />
        {displayName ? (
          // Avatar de 36px con degradado de marca como respaldo, segun el
          // handoff. No se replica su linea de rol ("Atleta Premium"): es
          // contenido inventado del prototipo y el perfil no tiene ese campo.
          <div className="flex items-center gap-2.5 rounded-[10px] p-2">
            <Avatar className="size-9 shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-primary-foreground bg-[linear-gradient(135deg,oklch(0.62_0.21_30),oklch(0.76_0.17_55))] text-[13px] font-bold">
                {initialsOf(displayName) || "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-foreground min-w-0 truncate text-[13px] font-semibold">
              {displayName}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
