import { AppShell } from "@/components/layout/app-shell";
import { messages } from "@/i18n/es-419";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell>
      {children}
      <footer className="text-muted-foreground border-t pt-4 text-xs text-balance">
        {messages.legal.disclaimer}
      </footer>
    </AppShell>
  );
}
