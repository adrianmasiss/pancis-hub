"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const FALLO = "No se pudo mover la comida.";

/**
 * Mueve una comida del plan a otra hora SOLO ese dia. El plan guarda su
 * hora; al dia siguiente vuelve la de siempre.
 */
export async function setMealTimeForDay(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({
      templateMealId: z.uuid(),
      date: z.iso.date(),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    })
    .safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: FALLO };

  const { error } = await supabase.from("diet_meal_day_times").upsert(
    {
      user_id: user.id,
      template_meal_id: parsed.data.templateMealId,
      date: parsed.data.date,
      scheduled_time: `${parsed.data.time}:00`,
    },
    { onConflict: "user_id,template_meal_id,date" },
  );
  if (error) return { error: FALLO };
  revalidatePath("/nutricion");
  revalidatePath("/");
  return {};
}

/** Devuelve la comida a la hora del plan para ese dia. */
export async function clearMealTimeForDay(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({ templateMealId: z.uuid(), date: z.iso.date() })
    .safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: FALLO };

  const { error } = await supabase
    .from("diet_meal_day_times")
    .delete()
    .eq("user_id", user.id)
    .eq("template_meal_id", parsed.data.templateMealId)
    .eq("date", parsed.data.date);
  if (error) return { error: FALLO };
  revalidatePath("/nutricion");
  revalidatePath("/");
  return {};
}
