import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AssistantFab } from "@/features/assistant/components/assistant-fab";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { messages } from "@/i18n/es-419";

type AppShellProps = {
  children: React.ReactNode;
  /** Acciones extra para la TopBar (por ejemplo, menu de usuario). */
  topBarActions?: React.ReactNode;
  displayName?: string;
  avatarUrl?: string | null;
};

export function AppShell({
  children,
  topBarActions,
  displayName,
  avatarUrl,
}: AppShellProps) {
  return (
    <div className="bg-background flex min-h-dvh w-full">
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2.5 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {messages.common.skipToContent}
      </a>
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar actions={topBarActions} />
        {/*
          Ritmo vertical: el respiro crece con el ancho en lugar de saltar de
          golpe. El relleno inferior en movil deja libre la barra de navegacion
          (64px) mas el area segura del dispositivo.
        */}
        <main
          id="contenido"
          className="flex-1 px-5 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-7 sm:py-8 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-10 lg:py-10 lg:pb-10 xl:px-12"
        >
          <div className="animate-fade-up mx-auto flex w-full max-w-[1100px] flex-col gap-6 sm:gap-7 lg:gap-8 lg:pb-2">
            {children}
          </div>
        </main>
      </div>
      <AssistantFab />
      <BottomNavigation displayName={displayName} avatarUrl={avatarUrl} />
    </div>
  );
}
