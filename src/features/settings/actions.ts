"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadPrivateFile } from "@/lib/storage/upload-private-file";
import { messages } from "@/i18n/es-419";
import {
  goalSettingsSchema,
  profileSettingsSchema,
  toleranceSettingsSchema,
  usernameSettingsSchema,
  type GoalSettingsInput,
  type ProfileSettingsInput,
  type ToleranceSettingsInput,
  type UsernameSettingsInput,
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
/**
 * Cambia el nombre de usuario.
 *
 * Va con la sesion del propio usuario, no con la llave de servicio: la policy
 * de `profiles` ya deja escribir la fila propia y nada mas, asi que no hace
 * falta evadir RLS para esto —y no evadirla es la diferencia entre "solo
 * puedes cambiar el tuyo" garantizado por la base y garantizado por que el
 * codigo no se equivoque—.
 *
 * Quien decide si el usuario esta libre es el indice unico: comprobarlo antes
 * y escribir despues seria una carrera. Se escribe, y si la base dice 23505
 * —violacion de unicidad— se traduce a un mensaje que se entiende.
 */
export async function updateUsername(
  input: UsernameSettingsInput,
): Promise<SettingsActionResult> {
  const parsed = usernameSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? messages.settings.saveFailed,
    };
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
    .update({ username: parsed.data.username })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: messages.auth.errors.usernameTaken };
    }
    console.error("[Settings] Fallo al cambiar el usuario", error);
    return { error: messages.settings.saveFailed };
  }

  revalidatePath("/configuracion");
  return { success: true };
}

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

/**
 * Solo el sistema de unidades (kg/cm o lb/in). Lo cambia el Perfil movil con
 * un toque, sin pasar por el formulario completo.
 */
export async function updateUnitSystem(input: {
  unitSystem: "metric" | "imperial";
}): Promise<SettingsActionResult> {
  if (input.unitSystem !== "metric" && input.unitSystem !== "imperial") {
    return { error: messages.settings.saveFailed };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.settings.saveFailed };

  const { error } = await supabase
    .from("profiles")
    .update({ unit_system: input.unitSystem })
    .eq("id", user.id);
  if (error) return { error: messages.settings.saveFailed };
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Enciende o apaga el ajuste de la meta por entreno. Al elegir, deja de valer
 * el defecto por el origen de la dieta.
 */
export async function updateTrainingAdjustment(input: {
  enabled: boolean;
}): Promise<SettingsActionResult> {
  if (typeof input.enabled !== "boolean")
    return { error: messages.settings.saveFailed };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.settings.saveFailed };

  const { error } = await supabase
    .from("profiles")
    .update({ training_adjustment: input.enabled })
    .eq("id", user.id);
  if (error) return { error: messages.settings.saveFailed };
  revalidatePath("/nutricion");
  revalidatePath("/");
  return { success: true };
}
