"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadExerciseCatalog } from "@/features/training/catalog-cache";
import {
  rankSubstitutes,
  type SubstituteMatch,
} from "@/features/training/lib/session-substitutes";
import { savePlanVersion } from "@/features/training/version-actions";

/**
 * Editor de rutina del telefono: se edita una copia en el cliente y se
 * guarda todo junto, con confirmacion. Antes de escribir se versiona la
 * rutina, asi «Versiones» puede devolverla tal como estaba.
 *
 * Escritorio sigue con sus acciones de a una (actions.ts).
 */

const FALLO = "No se pudo guardar la rutina. Intenta de nuevo.";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Hasta cinco reemplazos para la rutina, por parecido de musculos y patron
 * (el mismo motor que «Cambiar solo hoy», sin IA: no gasta cuota).
 */
export async function planReplacementOptions(
  input: unknown,
): Promise<{ error: string } | { options: SubstituteMatch[] }> {
  const parsed = z.object({ exerciseId: z.uuid() }).safeParse(input);
  const { user } = await requireUser();
  if (!parsed.success || !user)
    return { error: "No pudimos cargar alternativas." };
  try {
    const rows = await loadExerciseCatalog();
    const todos = rows.map((r) => ({
      id: r.id,
      name: r.name,
      primaryMuscle: r.primary_muscle,
      secondaryMuscles: r.secondary_muscles ?? [],
      movementPattern: r.movement_pattern,
      equipment: r.equipment,
    }));
    const source = todos.find((e) => e.id === parsed.data.exerciseId);
    if (!source) return { error: "No pudimos cargar alternativas." };
    const options = rankSubstitutes(source, todos, {
      limit: 12,
      minSimilarity: 30,
    })
      // El catalogo repite nombres (curado e importado): uno basta.
      .filter(
        (m, i, all) =>
          all.findIndex((x) => x.exercise.name === m.exercise.name) === i,
      )
      .slice(0, 5);
    return { options };
  } catch {
    return { error: "No pudimos cargar alternativas." };
  }
}

const exerciseSchema = z.object({
  /** Fila existente; sin id, es nueva. */
  id: z.uuid().optional(),
  exerciseId: z.uuid(),
  sets: z.number().int().min(1).max(20).nullable(),
  repsMin: z.number().int().min(1).max(100).nullable(),
  repsMax: z.number().int().min(1).max(100).nullable(),
  rir: z.number().min(0).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(900).nullable(),
});

const savePlanEditsSchema = z.object({
  planId: z.uuid(),
  days: z
    .array(
      z.object({
        dayId: z.uuid(),
        exercises: z.array(exerciseSchema).max(40),
      }),
    )
    .max(14),
});

export async function savePlanEdits(
  input: unknown,
): Promise<{ error: string } | { success: true }> {
  const parsed = savePlanEditsSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: FALLO };
  const { planId, days } = parsed.data;

  // Solo dias de una rutina del usuario (RLS lo exige igual).
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id, workout_plan_days(id)")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!plan) return { error: FALLO };
  const ownDays = new Set(plan.workout_plan_days.map((d) => d.id));
  if (days.some((d) => !ownDays.has(d.dayId))) return { error: FALLO };

  // Lo de antes queda como version («ya no hay cambios» no es un error).
  await savePlanVersion({ planId, reason: "Antes de editar la rutina" });

  for (const day of days) {
    const { data: existing, error: readError } = await supabase
      .from("workout_plan_exercises")
      .select("id")
      .eq("workout_plan_day_id", day.dayId);
    if (readError) return { error: FALLO };

    const keep = new Set(day.exercises.flatMap((e) => (e.id ? [e.id] : [])));
    const gone = (existing ?? []).filter((e) => !keep.has(e.id));
    if (gone.length) {
      const { error } = await supabase
        .from("workout_plan_exercises")
        .delete()
        .in(
          "id",
          gone.map((e) => e.id),
        );
      if (error) return { error: FALLO };
    }

    for (const [i, e] of day.exercises.entries()) {
      const values = {
        exercise_id: e.exerciseId,
        position: i + 1,
        sets: e.sets,
        target_reps_min: e.repsMin,
        target_reps_max: e.repsMax,
        target_rir: e.rir,
        rest_seconds: e.restSeconds,
      };
      const { error } = e.id
        ? await supabase
            .from("workout_plan_exercises")
            .update(values)
            .eq("id", e.id)
            .eq("workout_plan_day_id", day.dayId)
        : await supabase
            .from("workout_plan_exercises")
            .insert({ ...values, workout_plan_day_id: day.dayId });
      if (error) return { error: FALLO };
    }
  }

  // La version nueva es la que queda; su registro va a la auditoria.
  await savePlanVersion({ planId, reason: "Editada en el teléfono" });
  revalidatePath("/entrenamiento");
  return { success: true };
}
