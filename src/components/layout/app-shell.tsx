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
    <div className="flex min-h-dvh w-full">
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {messages.common.skipToContent}
      </a>
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar actions={topBarActions} />
        <main id="contenido" className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="animate-fade-up mx-auto w-full max-w-5xl space-y-6">
            {children}
          </div>
        </main>
      </div>
      <AssistantFab />
      <BottomNavigation displayName={displayName} avatarUrl={avatarUrl} />
    </div>
  );
}
