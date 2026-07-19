import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

type AppShellProps = {
  children: React.ReactNode;
  /** Acciones extra para la TopBar (por ejemplo, menu de usuario). */
  topBarActions?: React.ReactNode;
};

export function AppShell({ children, topBarActions }: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar actions={topBarActions} />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">{children}</div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
