"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, ArrowRight, Settings } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { UserMenu } from "@/features/auth/components/user-menu";
import { messages } from "@/i18n/es-419";
import { isActiveRoute, sidebarItems } from "@/lib/navigation";
import { useRail } from "@/lib/theme/rail";
import { cn } from "@/lib/utils";

type SidebarProps = {
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
};

/** Two independent islands, matching the supplied collapsed-rail reference. */
export function Sidebar({ displayName, email, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle } = useRail();
  return (
    <aside
      data-rail={collapsed ? "collapsed" : "expanded"}
      aria-label={messages.common.mainNavigation}
      className="app-rail capsule-rail rail-dock sticky top-0 z-[2] hidden h-dvh shrink-0 flex-col md:flex"
    >
      <Link href="/" aria-label={messages.app.name} className="capsule-brand">
        <span className="rail-narrow" aria-hidden="true">
          <BrandLogo variant="mark" height={36} />
        </span>
        <span className="rail-wide" aria-hidden="true">
          <BrandLogo height={32} />
        </span>
      </Link>
      <div className="rail-navigation">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls="primary-navigation"
          className="rail-pin"
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
        >
          <ArrowRight aria-hidden="true" />
        </button>
        <nav
          id="primary-navigation"
          aria-label="Destinos principales"
          className="rail-main rail-island"
        >
          {sidebarItems
            .filter((item) => item.href !== "/configuracion")
            .map(({ href, labelKey, icon: Icon }) => {
              const active = isActiveRoute(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={messages.nav[labelKey]}
                  aria-current={active ? "page" : undefined}
                  className={cn("rail-item", active && "capsule-active")}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2 : 1.7}
                    aria-hidden="true"
                  />
                  <span className="app-rail-label">
                    {messages.nav[labelKey]}
                  </span>
                </Link>
              );
            })}
        </nav>
      </div>
      <div className="rail-account rail-island">
        {[
          {
            href: "/historial",
            label: "Cambios del plan",
            icon: ArrowLeftRight,
          },
          {
            href: "/configuracion",
            label: messages.nav.settings,
            icon: Settings,
          },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            aria-current={isActiveRoute(pathname, href) ? "page" : undefined}
            className={cn(
              "rail-item",
              isActiveRoute(pathname, href) && "capsule-active",
            )}
          >
            <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
            <span className="app-rail-label">{label}</span>
          </Link>
        ))}
        {displayName && (
          <div className="capsule-profile">
            <UserMenu
              variant="row"
              displayName={displayName}
              email={email}
              avatarUrl={avatarUrl}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
