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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { messages } from "@/i18n/es-419";
import {
  bottomNavItems,
  isActiveRoute,
  getMoreSheetSections,
  settingsNavItem,
} from "@/lib/navigation";
import { triggerHaptic } from "@/lib/haptics";
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

/** Clases compartidas por las cinco celdas de la barra, para que el objetivo
 *  tactil sea identico en todas (48px de alto util). */
const TAB_BASE =
  "relative flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[0.625rem] leading-none font-medium transition-colors duration-200 [letter-spacing:0]";

/** Filete de bronce sobre la celda activa: la unica marca de color de la barra. */
function ActiveMark() {
  return (
    <span
      aria-hidden="true"
      className="bg-primary absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-b-full"
    />
  );
}

type BottomNavigationProps = {
  displayName?: string;
  avatarUrl?: string | null;
};

/**
 * Navegacion inferior movil. Barra anclada al ancho completo en lugar de
 * capsula flotante: cada destino muestra su etiqueta, de modo que la
 * navegacion se lee en vez de adivinarse.
 */
export function BottomNavigation({
  displayName,
  avatarUrl,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreSheetSections = getMoreSheetSections();
  const moreActive =
    isActiveRoute(pathname, settingsNavItem.href) ||
    moreSheetSections.some((group) =>
      group.items.some((item) => isActiveRoute(pathname, item.href)),
    );

  return (
    <nav
      aria-label={messages.common.mainNavigation}
      className="border-hairline surface-bar fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-1.5">
        {bottomNavItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          const label = messages.nav[item.bottomNavLabelKey ?? item.labelKey];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic("selection")}
              aria-current={active ? "page" : undefined}
              className={cn(
                TAB_BASE,
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:bg-muted",
              )}
            >
              {active ? <ActiveMark /> : null}
              <Icon className="size-[18px]" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={() => triggerHaptic("selection")}
              className={cn(
                TAB_BASE,
                moreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:bg-muted",
              )}
            >
              {moreActive ? <ActiveMark /> : null}
              <Menu className="size-[18px]" aria-hidden="true" />
              <span className="max-w-full truncate">{messages.nav.more}</span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="px-5 pt-5 pb-1 text-left">
              <SheetTitle className="text-base font-medium [letter-spacing:0]">
                {messages.nav.more}
              </SheetTitle>
              <SheetDescription className="text-[0.8125rem]">
                {messages.nav.moreDescription}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-5 pt-4">
              <Link
                href={settingsNavItem.href}
                onClick={() => {
                  triggerHaptic("selection");
                  setMoreOpen(false);
                }}
                className="border-hairline hover:bg-muted flex items-center gap-3.5 rounded-lg border p-3.5 transition-colors duration-200"
              >
                <Avatar className="border-hairline size-9 border">
                  {avatarUrl && displayName ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-[0.6875rem] font-medium">
                    {initialsOf(displayName ?? "") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {displayName || messages.nav.settings}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {messages.nav.settings}
                  </p>
                </div>
              </Link>

              {moreSheetSections.map((group) => (
                <div key={group.key} className="space-y-2">
                  <p className="label-micro px-0.5">{group.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const active = isActiveRoute(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            triggerHaptic("selection");
                            setMoreOpen(false);
                          }}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "border-hairline flex items-center gap-3 rounded-lg border px-3.5 py-3 text-[0.8125rem] transition-colors duration-200",
                            active
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              active && "text-primary",
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {messages.nav[item.labelKey]}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
