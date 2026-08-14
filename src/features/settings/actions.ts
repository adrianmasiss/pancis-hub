"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadPrivateFile } from "@/lib/storage/upload-private-file";
import { messages } from "@/i18n/es-419";
import {
  goalSettingsSchema,
  profileSettingsSchema,
  toleranceSettingsSchema,
  type GoalSettingsInput,
  type ProfileSettingsInput,
  type ToleranceSettingsInput,
} from "@/features/settings/schemas";

export type SettingsActionResult = { error: string } | { success: true };

const AVATAR_BUCKET = "avatars";
const AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export async function updateProfileSettings(
  input: ProfileSettingsInput,
): Promise<SettingsActionResult> {
  const parsed = profileSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.settings.saveFailed };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: messages.settings.saveFailed };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      height_cm: parsed.data.heightCm,
      unit_system: parsed.data.unitSystem,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id);

  if (error) {
    return { error: messages.settings.saveFailed };
  }

  revalidatePath("/configuracion");
  return { success: true };
}

/**
 * Cambia objetivo y nivel de actividad.
 *
 * Deliberadamente NO reescribe `nutrition_targets`. Cambiar el objetivo
 * mueve las calorias, pero aplicarlo en el mismo gesto convertiria un ajuste
 * de perfil en una reescritura silenciosa del plan: el aviso de recalculo
 * aparece despues, con las dos cifras a la vista, y se acepta aparte.
 */
export async function updateGoalSettings(
  input: GoalSettingsInput,
): Promise<SettingsActionResult> {
  const parsed = goalSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.settings.saveFailed };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: messages.settings.saveFailed };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      primary_goal: parsed.data.primaryGoal,
      activity_level: parsed.data.activityLevel,
    })
    .eq("id", user.id);

  if (error) {
    return { error: messages.settings.saveFailed };
  }

  revalidatePath("/configuracion");
  revalidatePath("/");
  return { success: true };
}

/**
 * Guarda el margen por macro.
 *
 * Las columnas existian desde la fase 3 y ninguna pantalla las dejaba tocar:
 * todo el mundo vivia con los valores por defecto sin saberlo.
 */
export async function updateToleranceSettings(
  input: ToleranceSettingsInput,
): Promise<SettingsActionResult> {
  const parsed = toleranceSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.settings.saveFailed };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: messages.settings.saveFailed };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      tolerance_calories_pct: parsed.data.caloriesPct,
      tolerance_protein_pct: parsed.data.proteinPct,
      tolerance_carbs_pct: parsed.data.carbsPct,
      tolerance_fat_pct: parsed.data.fatPct,
    })
    .eq("id", user.id);

  if (error) {
    return { error: messages.settings.saveFailed };
  }

  revalidatePath("/configuracion");
  revalidatePath("/");
  revalidatePath("/nutricion");
  return { success: true };
}

export async function uploadAvatar(
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.settings.avatarUploadFailed };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: messages.settings.avatarUploadFailed };
  }

  const path = await uploadPrivateFile(
    supabase,
    AVATAR_BUCKET,
    user.id,
    file,
    AVATAR_MIME,
    AVATAR_MAX_BYTES,
  );
  if (!path) return { error: messages.settings.avatarUploadFailed };

  const { data: previous } = await supabase
    .from("profiles")
    .select("avatar_storage_path")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_storage_path: path })
    .eq("id", user.id);
  if (error) return { error: messages.settings.avatarUploadFailed };

  if (previous?.avatar_storage_path) {
    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([previous.avatar_storage_path]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeAvatar(): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.settings.saveFailed };

  const { data: previous } = await supabase
    .from("profiles")
    .select("avatar_storage_path")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_storage_path: null })
    .eq("id", user.id);
  if (error) return { error: messages.settings.saveFailed };

  if (previous?.avatar_storage_path) {
    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([previous.avatar_storage_path]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}
