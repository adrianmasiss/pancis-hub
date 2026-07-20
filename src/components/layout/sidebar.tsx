"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";
import { isActiveRoute, sidebarItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-14 items-center px-6">
        <Link href="/" aria-label={messages.app.name}>
          <BrandLogo height={38} />
        </Link>
      </div>
      <nav
        aria-label={messages.common.mainNavigation}
        className="flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {sidebarItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
              <Icon
                className={cn("size-4.5", active && "text-primary")}
                aria-hidden="true"
              />
              {messages.nav[item.labelKey]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
