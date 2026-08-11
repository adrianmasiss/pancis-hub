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
 * Entrada del riel.
 *
 * Activo: canto de 3px a la izquierda y peso semibold. Nada mas. En reposo el
 * canto es transparente, asi que el texto no se desplaza al cambiar de pagina.
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
      /*
        El activo se marca con el canto grueso a la izquierda, como el borde de
        un disco apoyado en el rack. Sin pildora, sin degradado y sin halo: en
        este sistema el realce es grosor, no luz.
      */
      className={cn(
        "relative flex items-center gap-3 border-l-[3px] py-2.5 pr-3 pl-3 text-[13.5px] [letter-spacing:0] transition-colors duration-150 ease-out",
        active
          ? "border-l-foreground text-foreground font-semibold"
          : "hover:text-foreground hover:border-l-rule-strong border-l-transparent font-medium text-[var(--muted-foreground)]",
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
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
      {/* Bloque de marca. El wordmark va a una sola tinta: en un sistema
          donde el color es la magnitud, un logotipo de cuatro tintas era la
          mayor fuga de color de la interfaz. */}
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
            {/* Etiqueta de grupo en caja normal: las versalitas con tracking
                eran el antetitulo que el sistema retiro. */}
            <p className="px-3 pt-4 pb-1.5 text-xs text-[var(--subtle-foreground)]">
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
          // Respaldo en acero, no en degradado de marca: el color de esta
          // interfaz esta reservado al codigo de discos.
          <div className="flex items-center gap-2.5 rounded-[10px] p-2">
            <Avatar className="size-9 shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-[13px] font-bold">
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
