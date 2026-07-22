"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import {
  diffPlanSnapshots,
  isIdenticalPlanSnapshot,
  snapshotExerciseCount,
  snapshotTotalSets,
  type PlanSnapshot,
  type PlanVersionDifference,
  type PlanVersionSummary,
} from "@/features/training/lib/plan-versions";

const t = messages.training.versions;

const planIdSchema = z.object({
  planId: z.uuid(),
  reason: z.string().trim().max(200).optional(),
});

const versionIdSchema = z.object({ versionId: z.uuid() });

export type PlanVersionActionResult =
  | { error: string }
  | { success: true; version?: number };

/** Foto de la rutina tal como esta ahora, con nombres del momento. */
async function buildPlanSnapshot(
  userId: string,
  planId: string,
): Promise<PlanSnapshot | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_plans")
    .select(
      "name, objective, workout_plan_days(name, day_index, workout_plan_exercises(exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, target_rpe, tempo, rest_seconds, notes, exercise_catalog(name)))",
    )
    .eq("id", planId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;

  const numberOrNull = (value: unknown) =>
    value === null || value === undefined ? null : Number(value);

  return {
    name: data.name,
    objective: data.objective,
    days: [...(data.workout_plan_days ?? [])]
      .sort((a, b) => a.day_index - b.day_index)
      .map((day) => ({
        name: day.name,
        dayIndex: day.day_index,
        exercises: [...(day.workout_plan_exercises ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((exercise) => ({
            exerciseId: exercise.exercise_id,
            exerciseName: exercise.exercise_catalog?.name ?? "",
            position: exercise.position,
            sets: numberOrNull(exercise.sets),
            repsMin: numberOrNull(exercise.target_reps_min),
            repsMax: numberOrNull(exercise.target_reps_max),
            rir: numberOrNull(exercise.target_rir),
            rpe: numberOrNull(exercise.target_rpe),
            tempo: exercise.tempo,
            restSeconds: numberOrNull(exercise.rest_seconds),
            notes: exercise.notes,
          })),
      })),
  };
}

export async function savePlanVersion(
  input: unknown,
): Promise<PlanVersionActionResult> {
  const parsed = planIdSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const snapshot = await buildPlanSnapshot(user.id, parsed.data.planId);
  if (!snapshot) return { error: t.failed };

  const { data: latest } = await supabase
    .from("workout_plan_versions")
    .select("version, snapshot")
    .eq("plan_id", parsed.data.planId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    latest &&
    isIdenticalPlanSnapshot(latest.snapshot as PlanSnapshot, snapshot)
  ) {
    return { error: t.noChanges };
  }

  const version = (latest?.version ?? 0) + 1;

  const { error } = await supabase.from("workout_plan_versions").insert({
    user_id: user.id,
    plan_id: parsed.data.planId,
    version,
    name: snapshot.name,
    snapshot: snapshot as never,
    reason: parsed.data.reason ?? null,
  });
  if (error) return { error: t.failed };

  await recordChange({
    actorUserId: user.id,
    action: "rutina_versionada",
    entity: "workout_plans",
    entityId: parsed.data.planId,
    newValues: {
      version,
      dias: snapshot.days.length,
      ejercicios: snapshotExerciseCount(snapshot),
      series: snapshotTotalSets(snapshot),
    },
    reason: parsed.data.reason ?? t.defaultReason,
    origin: "usuario",
  });

  revalidatePath("/entrenamiento");
  return { success: true, version };
}

/**
 * Restaura una version anterior. Igual que en dietas: guarda el estado
 * actual antes de sobrescribir y versiona tambien el resultado, para que
 * la version mas reciente coincida con lo que queda en pantalla.
 */
export async function restorePlanVersion(
  input: unknown,
): Promise<PlanVersionActionResult> {
  const parsed = versionIdSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: target } = await supabase
    .from("workout_plan_versions")
    .select("plan_id, version, name, snapshot")
    .eq("id", parsed.data.versionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!target) return { error: t.failed };

  const planId = target.plan_id;
  const snapshot = target.snapshot as PlanSnapshot;

  await savePlanVersion({ planId, reason: t.autoBeforeRestore });

  const { data: currentDays } = await supabase
    .from("workout_plan_days")
    .select("id")
    .eq("workout_plan_id", planId);

  // Los ejercicios caen en cascada con sus dias.
  if (currentDays && currentDays.length > 0) {
    const { error: deleteError } = await supabase
      .from("workout_plan_days")
      .delete()
      .in(
        "id",
        currentDays.map((day) => day.id),
      );
    if (deleteError) return { error: t.failed };
  }

  for (const day of snapshot.days) {
    const { data: createdDay, error: dayError } = await supabase
      .from("workout_plan_days")
      .insert({
        workout_plan_id: planId,
        name: day.name,
        day_index: day.dayIndex,
      })
      .select("id")
      .single();
    if (dayError || !createdDay) return { error: t.failed };

    if (day.exercises.length === 0) continue;

    const { error: exercisesError } = await supabase
      .from("workout_plan_exercises")
      .insert(
        day.exercises.map((exercise) => ({
          workout_plan_day_id: createdDay.id,
          exercise_id: exercise.exerciseId,
          position: exercise.position,
          sets: exercise.sets,
          target_reps_min: exercise.repsMin,
          target_reps_max: exercise.repsMax,
          target_rir: exercise.rir,
          target_rpe: exercise.rpe,
          tempo: exercise.tempo,
          rest_seconds: exercise.restSeconds,
          notes: exercise.notes,
        })),
      );
    // Un ejercicio retirado del catalogo haria fallar la insercion.
    if (exercisesError) return { error: t.restoreIncomplete };
  }

  await supabase
    .from("workout_plans")
    .update({ name: snapshot.name, objective: snapshot.objective })
    .eq("id", planId)
    .eq("user_id", user.id);

  await savePlanVersion({
    planId,
    reason: t.restoreReason.replace("{version}", String(target.version)),
  });

  await recordChange({
    actorUserId: user.id,
    action: "rutina_restaurada",
    entity: "workout_plans",
    entityId: planId,
    newValues: { version_restaurada: target.version, nombre: target.name },
    reason: t.restoreReason.replace("{version}", String(target.version)),
    origin: "usuario",
  });

  revalidatePath("/entrenamiento");
  return { success: true, version: target.version };
}

export type PlanVersionList = {
  versions: PlanVersionSummary[];
  pendingChanges: PlanVersionDifference | null;
};

export async function listPlanVersions(
  planId: string,
): Promise<PlanVersionList> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { versions: [], pendingChanges: null };

  const { data } = await supabase
    .from("workout_plan_versions")
    .select("id, version, name, reason, created_at, snapshot")
    .eq("plan_id", planId)
    .eq("user_id", user.id)
    .order("version", { ascending: false });

  const versions: PlanVersionSummary[] = (data ?? []).map((row) => {
    const snapshot = row.snapshot as PlanSnapshot;
    return {
      id: row.id,
      version: row.version,
      name: row.name,
      reason: row.reason,
      createdAt: row.created_at,
      dayCount: snapshot.days.length,
      exerciseCount: snapshotExerciseCount(snapshot),
      totalSets: snapshotTotalSets(snapshot),
    };
  });

  const latest = data?.[0]?.snapshot as PlanSnapshot | undefined;
  const current = await buildPlanSnapshot(user.id, planId);
  const pendingChanges =
    latest && current ? diffPlanSnapshots(latest, current) : null;

  return { versions, pendingChanges };
}
