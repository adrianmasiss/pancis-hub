"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.wellbeing;

const scale = z.number().int().min(1).max(5).optional();

const wellbeingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: scale,
  energy: scale,
  stress: scale,
  soreness: scale,
  mood: scale,
  notes: z.string().trim().max(300).optional(),
});

export type WellbeingResult = { error: string } | { success: true };

/**
 * Registro diario de sueno, estres y energia
 * (docs/02_PRODUCT_REQUIREMENTS.md 19).
 *
 * Un registro por dia: si ya existe se actualiza, gracias al indice unico
 * (user_id, date). Vive en progreso porque es ahi donde estos datos se
 * leen junto a las mediciones.
 */
export async function saveWellbeing(input: unknown): Promise<WellbeingResult> {
  const parsed = wellbeingSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      date: parsed.data.date,
      sleep_hours: parsed.data.sleepHours ?? null,
      sleep_quality: parsed.data.sleepQuality ?? null,
      energy: parsed.data.energy ?? null,
      stress: parsed.data.stress ?? null,
      soreness: parsed.data.soreness ?? null,
      mood: parsed.data.mood ?? null,
      notes: parsed.data.notes || null,
    },
    { onConflict: "user_id,date" },
  );
  if (error) return { error: t.failed };

  revalidatePath("/progreso");
  revalidatePath("/");
  return { success: true };
}
