"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
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
 * Celda de la barra. Objetivo tactil de 44px y sin caja propia: el activo se
 * marca con el canto grueso abajo (`glow-ring`), no con una pildora.
 */
const TAB_BASE =
  "relative grid h-11 w-11 place-items-center transition-colors duration-150 ease-out";

/**
 * Los separadores entre grupos desaparecen: la barra a todo el ancho ya reparte
 * los objetivos, y una regla vertical dentro de otra barra con regla arriba es
 * ruido. Se conserva la funcion vacia para no tocar el mapeo de posiciones.
 */
function Rule() {
  return null;
}

type BottomNavigationProps = {
  displayName?: string;
  avatarUrl?: string | null;
};

/**
 * Navegacion inferior movil: la "isla" flotante del handoff v2.
 *
 * Capsula centrada a 20px del borde, de solo icono, con separadores entre
 * grupos y realce glow-ring en el activo. El handoff coloca ademas un FAB de
 * registro rapido en el centro; no se incluye porque esa accion no existe
 * todavia en el producto y el propio handoff la deja para "definir en la
 * implementacion real".
 *
 * Compromiso respecto al diseno anterior: se pierden las etiquetas visibles
 * bajo cada icono. La isla no da ancho para cinco etiquetas en 390px. Se
 * conservan como aria-label y title, de modo que lectores de pantalla y
 * puntero siguen teniendo el nombre del destino.
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
      className="island fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 pt-1.5 lg:hidden"
      style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
    >
      {bottomNavItems.map((item, index) => {
        const active = isActiveRoute(pathname, item.href);
        const Icon = item.icon;
        const label = messages.nav[item.bottomNavLabelKey ?? item.labelKey];
        return (
          <Fragment key={item.href}>
            {index === 2 ? <Rule /> : null}
            <Link
              href={item.href}
              onClick={() => triggerHaptic("selection")}
              aria-current={active ? "page" : undefined}
              // La isla es de solo icono: la etiqueta sigue existiendo para
              // lectores de pantalla y como titulo accesible.
              aria-label={label}
              title={label}
              className={cn(
                TAB_BASE,
                active
                  ? "glow-ring text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </Link>
          </Fragment>
        );
      })}
      <Rule />

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            onClick={() => triggerHaptic("selection")}
            aria-label={messages.nav.more}
            title={messages.nav.more}
            className={cn(
              TAB_BASE,
              moreActive
                ? "glow-ring text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Menu className="size-5" aria-hidden="true" />
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
