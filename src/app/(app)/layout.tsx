import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { isPhone } from "@/lib/device";
import { MobileShell } from "@/mobile/shell/mobile-shell";
import {
  DEFAULT_MOBILE_ACCENT,
  MOBILE_ACCENT_COOKIE,
  isMobileAccent,
} from "@/mobile/accent";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/storage/avatar-url";
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
    .select(
      "display_name, onboarding_completed_at, avatar_storage_path, unit_system",
    )
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const avatarUrl = await resolveAvatarUrl(
    supabase,
    profile.avatar_storage_path,
  );
  const displayName = profile.display_name ?? user.email ?? "";

  // Telefono: vista movil propia (src/mobile). Escritorio sigue igual.
  if (await isPhone()) {
    const accent = (await cookies()).get(MOBILE_ACCENT_COOKIE)?.value;
    // La sesion abierta, para la mini barra «Entrenando» de toda la app.
    const { data: live } = await supabase
      .from("workout_sessions")
      .select("id, started_at, paused_seconds, workout_plan_days(name)")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (
      <MobileShell
        displayName={displayName}
        email={user.email}
        avatarUrl={avatarUrl}
        accent={isMobileAccent(accent) ? accent : DEFAULT_MOBILE_ACCENT}
        units={profile.unit_system === "imperial" ? "imperial" : "metric"}
        live={
          live
            ? {
                id: live.id,
                startedAt: live.started_at,
                pausedSeconds: live.paused_seconds,
                dayName: live.workout_plan_days?.name ?? null,
              }
            : null
        }
      >
        {children}
        <footer className="sr-only">{messages.legal.disclaimer}</footer>
      </MobileShell>
    );
  }

  return (
    <AppShell
      displayName={displayName}
      email={user.email}
      avatarUrl={avatarUrl}
    >
      {children}
      <footer className="sr-only">{messages.legal.disclaimer}</footer>
    </AppShell>
  );
}
