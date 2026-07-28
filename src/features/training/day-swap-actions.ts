"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/audit";
import { messages } from "@/i18n/es-419";

/**
 * Sustituciones de ejercicio validas por un solo dia.
 *
 * Se separan a proposito de `substitutePlanExercise`, que reescribe el plan y
 * ahora exige confirmacion explicita. Aqui el plan NO se toca: se anota que
 * hoy, en lugar de un ejercicio, se hizo otro. Manana la rutina reaparece
 * como estaba.
 *
 * Mismo patron que `nutrition/day-swap-actions.ts`, a proposito: es el que ya
 * resolvio este problema del lado de la dieta.
 */

const daySwapSchema = z.object({
  planExerciseId: z.uuid(),
  date: z.iso.date(),
  substituteExerciseId: z.uuid(),
  /** Por que se sustituyo. Opcional, pero la UI lo pide. */
  reason: z.string().trim().max(300).optional(),
  source: z.enum(["usuario", "asistente"]).default("usuario"),
});

export type ExerciseDaySwapInput = z.infer<typeof daySwapSchema>;

export async function swapPlanExerciseForDay(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = daySwapSchema.safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };

  const { planExerciseId, date, substituteExerciseId, reason, source } =
    parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  // Nombres para el historial. Se leen antes de escribir porque despues la
  // vista ya muestra el sustituto y el original solo vive en la fila nueva.
  const [{ data: planExercise }, { data: substitute }] = await Promise.all([
    supabase
      .from("workout_plan_exercises")
      .select("exercise_catalog(name)")
      .eq("id", planExerciseId)
      .maybeSingle(),
    supabase
      .from("exercise_catalog")
      .select("name")
      .eq("id", substituteExerciseId)
      .maybeSingle(),
  ]);

  // upsert sobre (user_id, plan_exercise_id, date): sustituir dos veces el
  // mismo dia reemplaza la anterior en vez de acumular filas.
  const { error } = await supabase.from("exercise_day_swaps").upsert(
    {
      user_id: user.id,
      plan_exercise_id: planExerciseId,
      date,
      substitute_exercise_id: substituteExerciseId,
      reason: reason && reason.length > 0 ? reason : null,
      source,
    },
    { onConflict: "user_id,plan_exercise_id,date" },
  );

  if (error) return { error: messages.common.genericError };

  await recordChange({
    actorUserId: user.id,
    action: "ejercicio_sustituido_por_dia",
    entity: "exercise_day_swaps",
    entityId: planExerciseId,
    previousValues: planExercise?.exercise_catalog
      ? { ejercicio: planExercise.exercise_catalog.name }
      : null,
    newValues: substitute ? { ejercicio: substitute.name, fecha: date } : null,
    reason: reason && reason.length > 0 ? reason : messages.training.daySwap.defaultReason,
    origin: source === "asistente" ? "ia" : "usuario",
  });

  revalidatePath("/");
  revalidatePath("/entrenamiento");
  return {};
}

/** Deshace la sustitucion del dia y devuelve el ejercicio original. */
export async function undoPlanExerciseDaySwap(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({ planExerciseId: z.uuid(), date: z.iso.date() })
    .safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  const { error } = await supabase
    .from("exercise_day_swaps")
    .delete()
    .eq("user_id", user.id)
    .eq("plan_exercise_id", parsed.data.planExerciseId)
    .eq("date", parsed.data.date);

  if (error) return { error: messages.common.genericError };

  revalidatePath("/");
  revalidatePath("/entrenamiento");
  return {};
}
