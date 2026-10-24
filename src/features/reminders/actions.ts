"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { notificationPrefsSchema } from "./prefs";

const FALLO = "No se pudieron guardar los recordatorios.";

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(10).max(300),
    auth: z.string().min(10).max(100),
  }),
});

/**
 * Enciende los recordatorios y guarda la suscripcion push de este
 * dispositivo. Un usuario puede tener varias (telefono, tableta).
 */
export async function enableReminders(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = subscriptionSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: FALLO };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { error: FALLO };
  await supabase
    .from("profiles")
    .update({ reminders_enabled: true })
    .eq("id", user.id);
  return {};
}

/** Apaga los recordatorios y olvida las suscripciones del usuario. */
export async function disableReminders(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: FALLO };
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  const { error } = await supabase
    .from("profiles")
    .update({ reminders_enabled: false })
    .eq("id", user.id);
  return error ? { error: FALLO } : {};
}

/** Guarda que avisos quiere y a que hora (Perfil › Notificaciones). */
export async function saveNotificationPrefs(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = notificationPrefsSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: FALLO };
  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: parsed.data })
    .eq("id", user.id);
  return error ? { error: FALLO } : {};
}
