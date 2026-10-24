"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Marca o desmarca un ejercicio como favorito. Devuelve el estado nuevo. */
export async function toggleExerciseFavorite(
  input: unknown,
): Promise<{ error: string } | { favorite: boolean }> {
  const parsed = z.object({ exerciseId: z.uuid() }).safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: "No se pudo guardar." };

  const { data: existing } = await supabase
    .from("exercise_favorites")
    .select("exercise_id")
    .eq("user_id", user.id)
    .eq("exercise_id", parsed.data.exerciseId)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("exercise_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("exercise_id", parsed.data.exerciseId)
    : await supabase
        .from("exercise_favorites")
        .insert({ user_id: user.id, exercise_id: parsed.data.exerciseId });
  if (error) return { error: "No se pudo guardar." };
  revalidatePath("/entrenamiento");
  return { favorite: !existing };
}
