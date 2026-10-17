import { SurfaceLighting } from "./surface-lighting";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { NavLoadingScreen } from "@/components/layout/nav-loading-screen";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AssistantFab } from "@/features/assistant/components/assistant-fab";
import { BackgroundSwitcher } from "@/features/auth/components/background-switcher";
import { CON_SELECTOR } from "@/features/auth/fondos-guion";
import { messages } from "@/i18n/es-419";

type AppShellProps = {
  children: React.ReactNode;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
};

export function AppShell({
  children,
  displayName,
  email,
  avatarUrl,
}: AppShellProps) {
  return (
    <div className="app-shell bg-background relative flex min-h-dvh w-full">
      <SurfaceLighting />
      {/* Las manchas del handoff, detras de todo y sin capturar clics. */}
      <span aria-hidden="true" className="app-ambient" />
      {/* El fondo del SISTEMA, el que se elige en el selector. Va despues del
          ambiente para pintarse encima de el —si no, el resplandor naranja se
          quedaria delante de la foto y no se juzgaria nada— y sin variable
          elegida no pinta nada: es una capa vacia. */}
      <span aria-hidden="true" className="app-fondo" />
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2.5 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {messages.common.skipToContent}
      </a>
      <Sidebar displayName={displayName} email={email} avatarUrl={avatarUrl} />
      <div className="app-canvas relative z-[1] flex min-w-0 flex-1 flex-col">
        <TopBar displayName={displayName} email={email} avatarUrl={avatarUrl} />
        <main id="contenido" className="app-stage">
          <div className="app-content">{children}</div>
        </main>
      </div>
      <BottomNavigation />
      <AssistantFab />
      {/* La cortina de marca entre secciones. Se monta siempre porque no
          pinta nada hasta que una espera pasa del umbral. */}
      <NavLoadingScreen />
      {CON_SELECTOR ? <BackgroundSwitcher /> : null}
    </div>
  );
}
