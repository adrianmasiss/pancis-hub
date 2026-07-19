"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/features/settings/schemas";

export type SettingsActionResult = { error: string } | { success: true };

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
