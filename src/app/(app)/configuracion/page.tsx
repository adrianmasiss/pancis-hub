import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AvatarUpload } from "@/features/settings/components/avatar-upload";
import { AssistantMemoryCard } from "@/features/settings/components/assistant-memory-card";
import { GoalSettingsForm } from "@/features/settings/components/goal-settings-form";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { TargetsUpdateCard } from "@/features/settings/components/targets-update-card";
import { getTargetRecalculation } from "@/features/settings/target-recalculation";
import type { GoalSettingsInput } from "@/features/settings/schemas";
import { countConversations } from "@/features/assistant/persistence";
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
    .select(
      "display_name, height_cm, unit_system, timezone, avatar_storage_path, primary_goal, activity_level",
    )
    .eq("id", user.id)
    .single();
  const [avatarUrl, conversationCount, recalculation] = await Promise.all([
    resolveAvatarUrl(supabase, profile?.avatar_storage_path ?? null),
    countConversations(user.id),
    getTargetRecalculation(user.id),
  ]);

  return (
    <>
      <PageHeader title={messages.nav.settings} />
      {/* Arriba del todo porque es lo unico de esta pagina que espera una
          decision. Un aviso al final de una lista de formularios no lo lee
          nadie. */}
      {recalculation ? (
        <TargetsUpdateCard recalculation={recalculation} />
      ) : null}
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
      <GoalSettingsForm
        defaultValues={{
          primaryGoal:
            (profile?.primary_goal as GoalSettingsInput["primaryGoal"]) ??
            "recomposicion",
          activityLevel:
            (profile?.activity_level as GoalSettingsInput["activityLevel"]) ??
            "moderado",
        }}
      />
      <AssistantMemoryCard count={conversationCount} />
    </>
  );
}
