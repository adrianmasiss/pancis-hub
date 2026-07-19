import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UserMenu } from "@/features/auth/components/user-menu";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El proxy ya protege estas rutas; esto es defensa en profundidad.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      topBarActions={
        <UserMenu
          displayName={profile.display_name ?? user.email ?? ""}
          email={user.email ?? ""}
        />
      }
    >
      {children}
      <footer className="text-muted-foreground border-t pt-4 text-xs text-balance">
        {messages.legal.disclaimer}
      </footer>
    </AppShell>
  );
}
