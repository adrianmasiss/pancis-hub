import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AvatarUpload } from "@/features/settings/components/avatar-upload";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/storage/avatar-url";
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
    .select("display_name, height_cm, unit_system, timezone, avatar_storage_path")
    .eq("id", user.id)
    .single();
  const avatarUrl = await resolveAvatarUrl(
    supabase,
    profile?.avatar_storage_path ?? null,
  );

  return (
    <>
      <PageHeader title={messages.nav.settings} />
      <AvatarUpload
        displayName={profile?.display_name ?? user.email ?? ""}
        avatarUrl={avatarUrl}
      />
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
