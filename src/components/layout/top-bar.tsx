"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { messages } from "@/i18n/es-419";
import { isActiveRoute, navItems } from "@/lib/navigation";

export function TopBar({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();
  const current = navItems.find((item) => isActiveRoute(pathname, item.href));

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b px-4 backdrop-blur lg:px-8">
      <span className="text-sm font-semibold lg:text-base">
        {current ? messages.nav[current.labelKey] : messages.app.name}
      </span>
      <div className="flex items-center gap-1">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
