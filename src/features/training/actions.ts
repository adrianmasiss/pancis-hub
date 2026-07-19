"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  rankExerciseAlternatives,
  type CatalogExercise,
  type ExerciseAlternative,
} from "@/features/training/lib/alternatives";
import {
  addDaySchema,
  addPlanExerciseSchema,
  addSessionExerciseSchema,
  createPlanSchema,
  dayIdSchema,
  finishSessionSchema,
  logSetSchema,
  planExerciseIdSchema,
  planIdSchema,
  searchExercisesSchema,
  sessionIdSchema,
  setIdSchema,
  startSessionSchema,
  substitutePlanExerciseSchema,
  updatePlanExerciseSchema,
} from "@/features/training/schemas";

const t = messages.training;

export type TrainingActionResult = { error: string } | { success: true };

const fail: TrainingActionResult = { error: t.actionFailed };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateTraining() {
  revalidatePath("/entrenamiento");
}

// ---------------------------------------------------------------- rutinas

export async function createPlan(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = createPlanSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: created, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      objective: parsed.data.objective || null,
    })
    .select("id")
    .single();
  if (error || !created) return fail;

  // El primer dia se crea de una vez para reducir friccion.
  await supabase.from("workout_plan_days").insert({
    workout_plan_id: created.id,
    day_index: 1,
    name: "Dia 1",
  });
  revalidateTraining();
  return { success: true };
}

export async function setActivePlan(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = planIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  await supabase
    .from("workout_plans")
    .update({ active: false })
    .eq("user_id", user.id)
    .eq("active", true);
  const { error } = await supabase
    .from("workout_plans")
    .update({ active: true })
    .eq("id", parsed.data.planId)
    .eq("user_id", user.id);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function deletePlan(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = planIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_plans")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", parsed.data.planId)
    .eq("user_id", user.id);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function duplicatePlan(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = planIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: plan } = await supabase
    .from("workout_plans")
    .select(
      "name, objective, workout_plan_days(day_index, name, workout_plan_exercises(exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, target_rpe, tempo, rest_seconds, notes))",
    )
    .eq("id", parsed.data.planId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();
  if (!plan) return fail;

  const { data: created, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: `${plan.name} (copia)`,
      objective: plan.objective,
    })
    .select("id")
    .single();
  if (error || !created) return fail;

  for (const day of plan.workout_plan_days ?? []) {
    const { data: createdDay } = await supabase
      .from("workout_plan_days")
      .insert({
        workout_plan_id: created.id,
        day_index: day.day_index,
        name: day.name,
      })
      .select("id")
      .single();
    if (!createdDay) return fail;
    const exercises = day.workout_plan_exercises ?? [];
    if (exercises.length > 0) {
      const { error: exercisesError } = await supabase
        .from("workout_plan_exercises")
        .insert(
          exercises.map((exercise) => ({
            workout_plan_day_id: createdDay.id,
            exercise_id: exercise.exercise_id,
            position: exercise.position,
            sets: exercise.sets,
            target_reps_min: exercise.target_reps_min,
            target_reps_max: exercise.target_reps_max,
            target_rir: exercise.target_rir,
            target_rpe: exercise.target_rpe,
            tempo: exercise.tempo,
            rest_seconds: exercise.rest_seconds,
            notes: exercise.notes,
          })),
        );
      if (exercisesError) return fail;
    }
  }
  revalidateTraining();
  return { success: true };
}

export async function addPlanDay(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = addDaySchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: days } = await supabase
    .from("workout_plan_days")
    .select("day_index")
    .eq("workout_plan_id", parsed.data.planId)
    .order("day_index", { ascending: false })
    .limit(1);
  const nextIndex = (days?.[0]?.day_index ?? 0) + 1;

  const { error } = await supabase.from("workout_plan_days").insert({
    workout_plan_id: parsed.data.planId,
    day_index: nextIndex,
    name: parsed.data.name || `Dia ${nextIndex}`,
  });
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function deletePlanDay(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = dayIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_plan_days")
    .delete()
    .eq("id", parsed.data.dayId);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function addPlanExercise(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = addPlanExerciseSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: existing } = await supabase
    .from("workout_plan_exercises")
    .select("position")
    .eq("workout_plan_day_id", parsed.data.dayId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = (existing?.[0]?.position ?? 0) + 1;

  const { error } = await supabase.from("workout_plan_exercises").insert({
    workout_plan_day_id: parsed.data.dayId,
    exercise_id: parsed.data.exerciseId,
    position: nextPosition,
    sets: 3,
  });
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function updatePlanExercise(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = updatePlanExerciseSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_plan_exercises")
    .update({
      sets: parsed.data.sets ?? null,
      target_reps_min: parsed.data.repsMin ?? null,
      target_reps_max: parsed.data.repsMax ?? null,
      target_rir: parsed.data.rir ?? null,
      target_rpe: parsed.data.rpe ?? null,
      tempo: parsed.data.tempo || null,
      rest_seconds: parsed.data.restSeconds ?? null,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.planExerciseId);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function removePlanExercise(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = planExerciseIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_plan_exercises")
    .delete()
    .eq("id", parsed.data.planExerciseId);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function substitutePlanExercise(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = substitutePlanExerciseSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_plan_exercises")
    .update({ exercise_id: parsed.data.newExerciseId })
    .eq("id", parsed.data.planExerciseId);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

// ------------------------------------------------------------- ejercicios

type ExerciseRow = {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  movement_pattern: string | null;
  equipment: string | null;
  difficulty: string | null;
};

function toCatalogExercise(row: ExerciseRow): CatalogExercise {
  return {
    id: row.id,
    name: row.name,
    primaryMuscle: row.primary_muscle,
    secondaryMuscles: row.secondary_muscles ?? [],
    movementPattern: row.movement_pattern,
    equipment: row.equipment,
    difficulty: row.difficulty,
  };
}

export async function searchExercises(
  input: unknown,
): Promise<{ error: string } | { results: CatalogExercise[] }> {
  const parsed = searchExercisesSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data, error } = await supabase
    .from("exercise_catalog")
    .select(
      "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty",
    )
    .ilike("name", `%${parsed.data.term}%`)
    .is("deleted_at", null)
    .order("name")
    .limit(20);
  if (error) return { error: t.actionFailed };
  return { results: (data ?? []).map(toCatalogExercise) };
}

export async function getExerciseAlternatives(
  input: unknown,
): Promise<
  | { error: string }
  | { source: CatalogExercise; alternatives: ExerciseAlternative[] }
> {
  const parsed = planExerciseIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data: planExercise } = await supabase
    .from("workout_plan_exercises")
    .select(
      "exercise_catalog(id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty)",
    )
    .eq("id", parsed.data.planExerciseId)
    .single();
  if (!planExercise?.exercise_catalog) return { error: t.actionFailed };

  const { data: candidates } = await supabase
    .from("exercise_catalog")
    .select(
      "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty",
    )
    .is("deleted_at", null)
    .limit(200);

  const source = toCatalogExercise(
    planExercise.exercise_catalog as ExerciseRow,
  );
  return {
    source,
    alternatives: rankExerciseAlternatives(
      source,
      (candidates ?? []).map(toCatalogExercise),
    ),
  };
}

// --------------------------------------------------------------- sesiones

export async function startSession(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = startSessionSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  // Si hay una sesion en curso, se continua esa (no se duplican).
  const { data: inProgress } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .limit(1)
    .maybeSingle();
  if (inProgress) redirect(`/entrenamiento/sesion/${inProgress.id}`);

  const { data: created, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_plan_id: parsed.data.planId ?? null,
      workout_plan_day_id: parsed.data.planDayId ?? null,
    })
    .select("id")
    .single();
  if (error || !created) return fail;
  redirect(`/entrenamiento/sesion/${created.id}`);
}

export async function logSet(input: unknown): Promise<TrainingActionResult> {
  const parsed = logSetSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { count } = await supabase
    .from("workout_sets")
    .select("id", { count: "exact", head: true })
    .eq("session_id", parsed.data.sessionId)
    .eq("exercise_id", parsed.data.exerciseId);

  const { error } = await supabase.from("workout_sets").insert({
    session_id: parsed.data.sessionId,
    exercise_id: parsed.data.exerciseId,
    set_number: (count ?? 0) + 1,
    is_warmup: parsed.data.isWarmup,
    weight_kg: parsed.data.weightKg ?? null,
    repetitions: parsed.data.repetitions ?? null,
    rir: parsed.data.rir ?? null,
    rpe: parsed.data.rpe ?? null,
    tempo: parsed.data.tempo || null,
    rest_seconds: parsed.data.restSeconds ?? null,
    notes: parsed.data.notes || null,
  });
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

export async function deleteSet(input: unknown): Promise<TrainingActionResult> {
  const parsed = setIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", parsed.data.setId);
  if (error) return fail;
  revalidateTraining();
  return { success: true };
}

/** Valida y devuelve un ejercicio del catalogo para sumarlo a la sesion en la UI. */
export async function addSessionExercise(
  input: unknown,
): Promise<{ error: string } | { exercise: CatalogExercise }> {
  const parsed = addSessionExerciseSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data } = await supabase
    .from("exercise_catalog")
    .select(
      "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty",
    )
    .eq("id", parsed.data.exerciseId)
    .single();
  if (!data) return { error: t.actionFailed };
  return { exercise: toCatalogExercise(data as ExerciseRow) };
}

export async function finishSession(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = finishSessionSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id);
  if (error) return fail;
  revalidateTraining();
  redirect("/entrenamiento");
}

export async function discardSession(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = sessionIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .is("completed_at", null);
  if (error) return fail;
  revalidateTraining();
  redirect("/entrenamiento");
}
