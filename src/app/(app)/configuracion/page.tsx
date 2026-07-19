import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.settings };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, height_cm, unit_system, timezone")
    .eq("id", user.id)
    .single();

  return (
    <>
      <PageHeader title={messages.nav.settings} />
      <ProfileSettingsForm
        defaultValues={{
          displayName: profile?.display_name ?? "",
          heightCm: profile?.height_cm ?? 170,
          unitSystem:
            profile?.unit_system === "imperial" ? "imperial" : "metric",
          timezone: profile?.timezone ?? "UTC",
        }}
      />
    </>
  );
}
