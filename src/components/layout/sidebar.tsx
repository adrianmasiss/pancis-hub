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
 * Entrada del riel. El estado activo se marca con tres senales sobrias que se
 * refuerzan entre si: filete de bronce a la izquierda, fondo apenas elevado y
 * peso tipografico. Ningun resplandor.
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
        "relative flex items-center gap-3 rounded-md py-2.5 pr-3 pl-3.5 text-sm transition-colors duration-200 [letter-spacing:0]",
        active
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="bg-primary absolute top-1/2 left-0 h-4.5 w-0.5 -translate-y-1/2 rounded-r-full"
        />
      ) : null}
      <Icon
        className={cn("size-4.5 shrink-0", active && "text-primary")}
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
    <aside className="border-hairline bg-sidebar text-sidebar-foreground hidden w-[260px] shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 shrink-0 items-center px-6">
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
        className="flex-1 space-y-7 overflow-y-auto px-4 pt-3 pb-5"
      >
        <div className="space-y-0.5">
          <NavLink
            href={homeNavItem.href}
            labelKey={homeNavItem.labelKey}
            icon={homeNavItem.icon}
            active={isActiveRoute(pathname, homeNavItem.href)}
          />
        </div>

        {sidebarSections.map((group) => (
          <div key={group.key} className="space-y-0.5">
            <p className="label-micro px-3.5 pb-2">{group.label}</p>
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

      <div className="border-hairline shrink-0 space-y-1 border-t px-4 py-4">
        <NavLink
          href={settingsNavItem.href}
          labelKey={settingsNavItem.labelKey}
          icon={settingsNavItem.icon}
          active={isActiveRoute(pathname, settingsNavItem.href)}
        />
        {displayName ? (
          <div className="flex items-center gap-3 px-3.5 pt-3">
            <Avatar className="border-hairline size-8 border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-muted text-muted-foreground text-[0.6875rem] font-medium">
                {initialsOf(displayName) || "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-foreground min-w-0 truncate text-[0.8125rem] font-medium">
              {displayName}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
