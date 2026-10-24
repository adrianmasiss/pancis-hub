import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewHeader } from "@/components/shared/view-header";
import { AvatarUpload } from "@/features/settings/components/avatar-upload";
import { AccountCard } from "@/features/settings/components/account-card";
import { UsernameCard } from "@/features/settings/components/username-card";
import { AppearanceCard } from "@/features/settings/components/appearance-card";
import { AssistantMemoryCard } from "@/features/settings/components/assistant-memory-card";
import { GoalSettingsForm } from "@/features/settings/components/goal-settings-form";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { TargetsUpdateCard } from "@/features/settings/components/targets-update-card";
import { ToleranceSettingsForm } from "@/features/settings/components/tolerance-settings-form";
import { FoodSourcesCard } from "@/features/settings/components/food-sources-card";
import { countFoodsToReview } from "@/features/foods/source-queries";
import { DEFAULT_TOLERANCES } from "@/features/nutrition/lib/tolerances";
import { getTargetRecalculation } from "@/features/settings/target-recalculation";
import type { GoalSettingsInput } from "@/features/settings/schemas";
import { countConversations } from "@/features/assistant/persistence";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/storage/avatar-url";
import { messages } from "@/i18n/es-419";
import { isPhone } from "@/lib/device";
import { todayInTimezone } from "@/lib/dates";
import { ProfileMobile } from "@/mobile/screens/profile/profile-mobile";
import { MobileFormsFrame } from "@/mobile/screens/profile/forms-frame";

export const metadata: Metadata = { title: messages.nav.settings };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const phone = await isPhone();
  const { vista } = await searchParams;
  if (phone && vista !== "editar") {
    const { data: tz } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle();
    return (
      <ProfileMobile
        userId={user.id}
        email={user.email}
        today={todayInTimezone(tz?.timezone ?? "America/Costa_Rica")}
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, username, height_cm, unit_system, timezone, avatar_storage_path, primary_goal, activity_level, tolerance_calories_pct, tolerance_protein_pct, tolerance_carbs_pct, tolerance_fat_pct",
    )
    .eq("id", user.id)
    .single();
  const [avatarUrl, conversationCount, recalculation, foodsToReview] =
    await Promise.all([
      resolveAvatarUrl(supabase, profile?.avatar_storage_path ?? null),
      countConversations(user.id),
      getTargetRecalculation(user.id),
      countFoodsToReview(),
    ]);

  const forms = (
    <>
      <ViewHeader title={messages.nav.settings} />
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
      <ToleranceSettingsForm
        defaultValues={{
          caloriesPct: Number(
            profile?.tolerance_calories_pct ?? DEFAULT_TOLERANCES.caloriesPct,
          ),
          proteinPct: Number(
            profile?.tolerance_protein_pct ?? DEFAULT_TOLERANCES.proteinPct,
          ),
          carbsPct: Number(
            profile?.tolerance_carbs_pct ?? DEFAULT_TOLERANCES.carbsPct,
          ),
          fatPct: Number(
            profile?.tolerance_fat_pct ?? DEFAULT_TOLERANCES.fatPct,
          ),
        }}
      />
      {/* Junto a las tolerancias: las dos deciden que numero de nutricion
          vale para ti. Vivia como franja en la Biblioteca. */}
      <FoodSourcesCard count={foodsToReview} />
      <AssistantMemoryCard count={conversationCount} />
      <AppearanceCard />
      {/* Junto a la cuenta y no arriba con el perfil: el usuario no es como te
          presentas, es como entras. */}
      <UsernameCard username={profile?.username ?? null} />
      <AccountCard email={user.email} />
    </>
  );

  // En telefono, «Editar» abre los formularios de siempre en su marco.
  return phone ? <MobileFormsFrame>{forms}</MobileFormsFrame> : forms;
}
