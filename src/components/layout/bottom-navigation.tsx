"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { messages } from "@/i18n/es-419";
import {
  bottomNavItems,
  isActiveRoute,
  moreSheetItems,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreSheetItems.some((item) =>
    isActiveRoute(pathname, item.href),
  );

  return (
    <nav
      aria-label={messages.common.mainNavigation}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {bottomNavItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {messages.nav[item.bottomNavLabelKey ?? item.labelKey]}
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-medium",
                moreActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Menu className="size-5" aria-hidden="true" />
              {messages.nav.more}
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle>{messages.nav.more}</SheetTitle>
              <SheetDescription>
                {messages.nav.moreDescription}
              </SheetDescription>
            </SheetHeader>
            <nav className="grid grid-cols-2 gap-2 px-4 pb-6">
              {moreSheetItems.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60",
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden="true" />
                    {messages.nav[item.labelKey]}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
