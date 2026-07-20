"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.checkins;

const scale = z.number().int().min(1).max(5).optional();

const checkinSchema = z.object({
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: scale,
  hunger: scale,
  energy: scale,
  stress: scale,
  soreness: scale,
  mood: scale,
  nutritionAdherence: scale,
  trainingCompleted: z.boolean().optional(),
  notes: z.string().trim().max(300).optional(),
});

export type CheckinActionResult = { error: string } | { success: true };

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Crea o actualiza el diario de HOY (un registro por dia). */
export async function saveTodayCheckin(
  input: unknown,
): Promise<CheckinActionResult> {
  const parsed = checkinSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const today = todayInTimezone(profile?.timezone ?? "UTC");

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      date: today,
      sleep_hours: parsed.data.sleepHours ?? null,
      sleep_quality: parsed.data.sleepQuality ?? null,
      hunger: parsed.data.hunger ?? null,
      energy: parsed.data.energy ?? null,
      stress: parsed.data.stress ?? null,
      soreness: parsed.data.soreness ?? null,
      mood: parsed.data.mood ?? null,
      nutrition_adherence: parsed.data.nutritionAdherence ?? null,
      training_completed: parsed.data.trainingCompleted ?? null,
      notes: parsed.data.notes || null,
    },
    { onConflict: "user_id,date" },
  );
  if (error) return { error: t.actionFailed };

  revalidatePath("/diario");
  revalidatePath("/");
  return { success: true };
}
