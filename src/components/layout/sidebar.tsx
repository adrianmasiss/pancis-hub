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
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="bg-brand-gradient absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full"
        />
      ) : null}
      <Icon className={cn("size-4.5", active && "text-primary")} aria-hidden="true" />
      {messages.nav[labelKey]}
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
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-14 items-center px-6">
        <Link href="/" aria-label={messages.app.name}>
          <BrandLogo height={38} />
        </Link>
      </div>
      <nav
        aria-label={messages.common.mainNavigation}
        className="flex-1 space-y-4 overflow-y-auto px-3 py-2"
      >
        <div className="space-y-1">
          <NavLink
            href={homeNavItem.href}
            labelKey={homeNavItem.labelKey}
            icon={homeNavItem.icon}
            active={isActiveRoute(pathname, homeNavItem.href)}
          />
        </div>
        {sidebarSections.map((group) => (
          <div key={group.key} className="space-y-1">
            <p className="text-muted-foreground px-3 text-xs font-medium tracking-wide uppercase">
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
      <div className="border-sidebar-border space-y-1 border-t px-3 py-3">
        {displayName ? (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Avatar className="size-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="text-xs">
                {initialsOf(displayName) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{displayName}</span>
          </div>
        ) : null}
        <NavLink
          href={settingsNavItem.href}
          labelKey={settingsNavItem.labelKey}
          icon={settingsNavItem.icon}
          active={isActiveRoute(pathname, settingsNavItem.href)}
        />
      </div>
    </aside>
  );
}
