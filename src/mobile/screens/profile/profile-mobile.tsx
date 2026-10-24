import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/storage/avatar-url";
import { getProgressData } from "@/features/progress/queries";
import { addDaysISO } from "@/lib/dates";
import { messages } from "@/i18n/es-419";
import { ProfileView, type ProfileSummary } from "./profile-view";

/**
 * Perfil y configuracion en telefono: quien eres, tus numeros, tus planes y
 * la apariencia (tema y acento). Lo que se edita a fondo sigue en los
 * formularios de siempre («Editar»).
 */
export async function ProfileMobile({
  userId,
  email,
  today,
}: {
  userId: string;
  email?: string;
  today: string;
}) {
  const supabase = await createClient();
  const [{ data: profile }, progress, sessions, meals, diet, plan] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, height_cm, primary_goal, created_at, avatar_storage_path, training_adjustment, reminders_enabled",
        )
        .eq("id", userId)
        .single(),
      getProgressData(userId),
      supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null),
      supabase
        .from("meals")
        .select("date")
        .eq("user_id", userId)
        .in("status", ["completada", "completada_con_cambios"])
        .is("deleted_at", null)
        .gte("date", addDaysISO(today, -120)),
      supabase
        .from("diet_templates")
        .select("name, origin")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("workout_plans")
        .select("name, origin")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle(),
    ]);

  /* Racha: dias seguidos, hasta hoy o ayer, con algo registrado (comidas o
     entreno). Hoy sin registro todavia no la rompe. */
  const activos = new Set<string>([
    ...(meals.data ?? []).map((m) => m.date),
    ...(sessions.data ?? []).map((s) => s.started_at.slice(0, 10)),
  ]);
  let racha = 0;
  let dia = activos.has(today) ? today : addDaysISO(today, -1);
  while (activos.has(dia)) {
    racha += 1;
    dia = addDaysISO(dia, -1);
  }

  const pesos = progress.weightSeries;
  const goal = profile?.primary_goal as
    keyof typeof messages.dashboard.goals | null;
  const summary: ProfileSummary = {
    displayName: profile?.display_name ?? email ?? "",
    email: email ?? null,
    avatarUrl: await resolveAvatarUrl(
      supabase,
      profile?.avatar_storage_path ?? null,
    ),
    goal: goal ? (messages.dashboard.goals[goal] ?? null) : null,
    since: profile?.created_at ?? null,
    workouts: sessions.data?.length ?? 0,
    streak: racha,
    weightChange:
      pesos.length > 1 ? pesos.at(-1)!.value - pesos[0]!.value : null,
    weightSince: pesos[0]?.date ?? null,
    heightCm: profile?.height_cm ?? null,
    weightKg: progress.lastWeight,
    bodyFat:
      progress.measurements.find((m) => m.bodyFatPercentage !== null)
        ?.bodyFatPercentage ?? null,
    dietName: diet.data?.name ?? null,
    planName: plan.data?.name ?? null,
    planOrigin: (plan.data?.origin as "coach" | "ia" | undefined) ?? null,
    dietOrigin: diet.data?.origin ?? null,
    trainingAdjustment:
      profile?.training_adjustment ?? diet.data?.origin === "ia",
    trainingAdjustmentByDefault: profile?.training_adjustment == null,
    remindersEnabled: profile?.reminders_enabled ?? false,
  };

  return <ProfileView summary={summary} />;
}
