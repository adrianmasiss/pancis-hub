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

/**
 * Celda de la barra: icono arriba, rotulo debajo, sin caja propia.
 *
 * El objetivo tactil llega a 56px de alto y a un quinto del ancho, que en 390px
 * son 78px: de sobra para el pulgar y para el rotulo.
 */
const TAB_BASE =
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-[color,transform] duration-[var(--dur-fast)] active:scale-[0.94]";

const TAB_LABEL = "max-w-full truncate text-[0.625rem] leading-none";

type BottomNavigationProps = {
  displayName?: string;
  avatarUrl?: string | null;
};

/**
 * Navegacion inferior movil.
 *
 * Barra anclada al borde, translucida, con las cinco pestanas repartiendose el
 * ancho. Vuelven los rotulos: eran solo `aria-label` porque la version anterior
 * era una capsula flotante estrecha, pero a todo el ancho caben, y un icono
 * suelto obliga a adivinar el destino.
 *
 * El activo se marca SOLO con color y peso: el rotulo y el icono toman el
 * acento, y el trazo del icono engorda. Nada de pastilla detras — esa es la
 * firma de Material 3, y fue lo primero que delato el diseno como Android.
 *
 * (SF Symbols marcaria el activo con la variante rellena. lucide es un juego de
 * trazo sin variantes rellenas, asi que se usa el otro eje que Apple tambien
 * usa, el peso. Rellenar los glifos de lucide da resultados dispares: `Home`
 * cierra silueta, pero `Utensils` y `TrendingUp` son trazos abiertos y se
 * convierten en manchas.)
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
      /*
        Anclada al borde y a todo el ancho, no una capsula flotante. Se usa de
        pie y con una mano: los objetivos se reparten el ancho y quedan todos
        al alcance del pulgar, y la barra se apoya en la regla de seccion en
        vez de levitar sobre el contenido.
      */
      className="island fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-1 px-2 pt-1.5 lg:hidden"
      style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
    >
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
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className="size-[22px] shrink-0"
              strokeWidth={active ? 2.25 : 1.75}
              aria-hidden="true"
            />
            <span className={cn(TAB_LABEL, active && "font-semibold")}>
              {label}
            </span>
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
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Menu
              className="size-[22px] shrink-0"
              strokeWidth={moreActive ? 2.25 : 1.75}
              aria-hidden="true"
            />
            <span className={cn(TAB_LABEL, moreActive && "font-semibold")}>
              {messages.nav.more}
            </span>
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
    </nav>
  );
}
