"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { UserMenu } from "@/features/auth/components/user-menu";
import { messages } from "@/i18n/es-419";
import {
  isActiveRoute,
  sidebarItems,
  type NavLabelKey,
} from "@/lib/navigation";
import { useRail } from "@/lib/theme/rail";
import { cn } from "@/lib/utils";

/**
 * Destino del riel.
 *
 * El activo se marca con una pastilla en el acento y la tinta invertida, como
 * el prototipo. El rotulo se recorta al colapsar en vez de desmontarse: el
 * riel colapsado seria iconos sin nombre para un lector de pantalla, y `title`
 * cubre al raton, que no oye el nombre accesible.
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
  const label = messages.nav[labelKey];
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={label}
      className={cn(
        "rail-item flex items-center gap-3 px-3 text-[14px] [letter-spacing:-0.01em] transition-[background-color,color] duration-[var(--dur-base)] active:translate-y-px",
        active
          ? "bg-primary text-primary-foreground font-medium"
          : "font-normal text-white/55 hover:bg-white/[0.06] hover:text-white/90",
      )}
    >
      <Icon
        className="size-[19px] shrink-0"
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden="true"
      />
      <span className="app-rail-label truncate">{label}</span>
    </Link>
  );
}

type SidebarProps = {
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
};

export function Sidebar({ displayName, email, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const { pinned, collapsed, toggle } = useRail();

  return (
    <aside
      data-rail={pinned ?? undefined}
      aria-label={messages.common.mainNavigation}
      className="app-rail rail-dock sticky top-0 z-[2] hidden h-dvh shrink-0 flex-col items-stretch justify-start gap-4 py-3.5 pr-0 pl-3.5 md:flex"
    >
      {/* La marca vive fuera de la isla, como en el prototipo: el logotipo ya
          lleva el nombre, asi que no necesita mosaico ni rotulo. */}
      <Link
        href="/"
        aria-label={messages.app.name}
        className="flex h-[46px] shrink-0 items-center justify-center rounded-xl px-2 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <span className="rail-wide">
          <BrandLogo height={26} />
        </span>
        <span className="rail-narrow">
          <BrandLogo variant="mark" height={30} />
        </span>
      </Link>

      {/* La isla abraza sus destinos; el hueco que sobra es lienzo, no isla.
          `flex-1` la estiraba hasta el pie y dejaba un bloque oscuro vacio de
          media pantalla debajo de Configuracion. */}
      <nav className="rail-island flex min-h-0 shrink flex-col gap-[var(--nav-gap)] overflow-x-hidden overflow-y-auto">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            labelKey={item.labelKey}
            icon={item.icon}
            active={isActiveRoute(pathname, item.href)}
          />
        ))}
      </nav>

      {/* Segunda isla: el pin y la cuenta. Separada de los destinos porque no
          son destinos — son controles del propio riel. */}
      <div className="rail-island mt-auto flex shrink-0 flex-col gap-[var(--nav-gap)]">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={
            collapsed
              ? messages.common.expandRail
              : messages.common.collapseRail
          }
          title={
            collapsed
              ? messages.common.expandRail
              : messages.common.collapseRail
          }
          className="rail-item flex items-center gap-3 px-3 text-white/45 transition-colors duration-[var(--dur-fast)] hover:bg-white/[0.06] hover:text-white/85 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:outline-none active:translate-y-px"
        >
          <span className="rail-narrow">
            <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="rail-wide">
            <PanelLeftClose className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="app-rail-label truncate text-[14px]">
            {collapsed
              ? messages.common.expandRail
              : messages.common.collapseRail}
          </span>
        </button>

        {displayName ? (
          <UserMenu
            variant="row"
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
          />
        ) : null}
      </div>
    </aside>
  );
}
