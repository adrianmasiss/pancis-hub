"use client";

import { createContext, useContext, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { NavLoadingScreen } from "@/components/layout/nav-loading-screen";
import { manrope, saira } from "@/mobile/fonts";
import { accentVars, type MobileAccent } from "@/mobile/accent";
import { MOBILE_PORTAL_ID, isMobileReady } from "@/mobile/routes";
import { GlassTabBar } from "./glass-tab-bar";
import "@/mobile/mobile.css";

type MobileUser = {
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
};

export type UnitSystem = "metric" | "imperial";

type MobileContextValue = MobileUser & {
  accent: MobileAccent;
  units: UnitSystem;
};

const MobileContext = createContext<MobileContextValue | null>(null);

const SIN_CONTEXTO: MobileContextValue = {
  displayName: "",
  avatarUrl: null,
  accent: "naranja",
  units: "metric",
};

/**
 * Usuario y acento de la vista movil, para el avatar y Perfil.
 *
 * No lanza fuera del armazon: al navegar entre una pantalla portada y una que
 * no, la ruta cambia un instante antes que el contenido y la pantalla movil
 * saliente llega a pintarse dentro del `AppShell`. Antes eso tiraba un error
 * (el «1 Issue» de desarrollo).
 */
export function useMobile(): MobileContextValue {
  return useContext(MobileContext) ?? SIN_CONTEXTO;
}

/**
 * Armazon de la vista de telefono. Solo lo monta el layout cuando
 * `isPhone()` es cierto.
 *
 * Las rutas que aun no tienen pantalla propia siguen con el `AppShell` de
 * siempre (y su `movil.css`), asi el porte puede ir por fases sin dejar
 * pantallas a medias.
 */
export function MobileShell({
  children,
  accent,
  units,
  ...user
}: MobileUser & {
  children: React.ReactNode;
  accent: MobileAccent;
  units: UnitSystem;
}) {
  const pathname = usePathname();

  if (!isMobileReady(pathname)) {
    return <AppShell {...user}>{children}</AppShell>;
  }

  return (
    <MobileContext.Provider value={{ ...user, accent, units }}>
      <div
        className={`m-app ${manrope.variable} ${saira.variable}`}
        style={accentVars(accent) as CSSProperties}
      >
        <main id="contenido">{children}</main>
        {/* Las pantallas completas (la sesion en curso) la ocultan con
            `data-m-fullscreen`, desde CSS: sin parpadeo al hidratar. */}
        <GlassTabBar />
        <NavLoadingScreen />
        <div id={MOBILE_PORTAL_ID} />
      </div>
    </MobileContext.Provider>
  );
}
