import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
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
    <div className="bg-background relative flex min-h-dvh w-full">
      {/* Las manchas del handoff, detras de todo y sin capturar clics. */}
      <span aria-hidden="true" className="app-ambient" />
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2.5 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {messages.common.skipToContent}
      </a>
      <Sidebar displayName={displayName} email={email} avatarUrl={avatarUrl} />
      <div className="app-canvas relative z-[1] flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/*
          Ritmo vertical: el respiro crece con el ancho en lugar de saltar de
          golpe. El relleno inferior en movil deja libre la barra de navegacion
          (64px) mas el area segura del dispositivo.

          Desde tablet el relleno derecho suma `--copilot-gutter`: el pasillo
          de 74px que el handoff reserva para que el acceso flotante al
          copiloto no caiga sobre el contenido. En telefono el pasillo es 0
          porque ahi el flotante no se muestra.
        */}
        <main
          id="contenido"
          className="flex-1 px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-7 sm:pb-[calc(6.25rem+env(safe-area-inset-bottom))] md:pr-[calc(1.75rem+var(--copilot-gutter))] md:pb-12 lg:px-11 lg:pr-[calc(2.75rem+var(--copilot-gutter))] xl:pl-13"
        >
          <div className="animate-fade-up mx-auto flex w-full max-w-[1280px] flex-col gap-0">
            {children}
          </div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
