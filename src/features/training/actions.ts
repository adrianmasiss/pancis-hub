"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import { type CatalogExercise } from "@/features/training/lib/alternatives";
import {
  rateExercise,
  type BiomechanicalExercise,
  type ExerciseRating,
  type ExperienceLevel,
  type RatingContext,
  type ResistanceProfile,
  type TrainingGoal,
} from "@/features/training/lib/biomechanics";
import {
  rankComparisons,
  type ExerciseComparison,
} from "@/features/training/lib/exercise-comparison";
import {
  recommendPrescription,
  type Prescription,
} from "@/features/training/lib/prescription";
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

  // Estado anterior antes de sobrescribirlo, para el historial.
  const { data: previous } = await supabase
    .from("workout_plan_exercises")
    .select("exercise_catalog(name)")
    .eq("id", parsed.data.planExerciseId)
    .single();

  const { error } = await supabase
    .from("workout_plan_exercises")
    .update({ exercise_id: parsed.data.newExerciseId })
    .eq("id", parsed.data.planExerciseId);
  if (error) return fail;

  const { data: replacement } = await supabase
    .from("exercise_catalog")
    .select("name")
    .eq("id", parsed.data.newExerciseId)
    .single();

  await recordChange({
    actorUserId: user.id,
    action: "ejercicio_sustituido",
    entity: "workout_plan_exercises",
    entityId: parsed.data.planExerciseId,
    previousValues: previous?.exercise_catalog
      ? { ejercicio: previous.exercise_catalog.name }
      : null,
    newValues: replacement ? { ejercicio: replacement.name } : null,
    reason: t.substitutionReason,
    origin: "usuario",
  });

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

/** Columnas biomecanicas del catalogo, usadas por la ficha y la comparacion. */
const BIOMECHANICS_COLUMNS =
  "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, joints, resistance_profile, hardest_point, stability, range_of_motion, technical_demand, systemic_fatigue, progression_ease, is_unilateral, common_errors, technique_cues, setup_notes, execution_notes, image_url, image_end_url";

type BiomechanicsRow = ExerciseRow & {
  image_url: string | null;
  image_end_url: string | null;
  joints: string[] | null;
  resistance_profile: string | null;
  hardest_point: string | null;
  stability: number | null;
  range_of_motion: number | null;
  technical_demand: number | null;
  systemic_fatigue: number | null;
  progression_ease: number | null;
  is_unilateral: boolean | null;
  common_errors: string[] | null;
  technique_cues: string[] | null;
  setup_notes?: string | null;
  execution_notes?: string | null;
};

function toBiomechanicalExercise(
  row: BiomechanicsRow,
): BiomechanicalExercise {
  return {
    ...toCatalogExercise(row),
    joints: row.joints ?? [],
    resistanceProfile: (row.resistance_profile as ResistanceProfile) ?? null,
    hardestPoint: row.hardest_point,
    stability: row.stability,
    rangeOfMotion: row.range_of_motion,
    technicalDemand: row.technical_demand,
    systemicFatigue: row.systemic_fatigue,
    progressionEase: row.progression_ease,
    isUnilateral: row.is_unilateral ?? false,
    commonErrors: row.common_errors ?? [],
    techniqueCues: row.technique_cues ?? [],
    imageUrl: row.image_url ?? null,
    imageEndUrl: row.image_end_url ?? null,
  };
}

/**
 * Contexto de valoracion del usuario. El objetivo del perfil se traduce
 * al vocabulario de entrenamiento; sin datos se asume lo mas comun para
 * la app (hipertrofia, nivel intermedio).
 */
async function getRatingContext(userId: string): Promise<RatingContext> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal, experience_level")
    .eq("id", userId)
    .maybeSingle();

  const goal: TrainingGoal =
    profile?.primary_goal === "ganancia_muscular"
      ? "hipertrofia"
      : profile?.primary_goal === "perdida_grasa"
        ? "recomposicion"
        : profile?.primary_goal === "recomposicion"
          ? "recomposicion"
          : "hipertrofia";

  const experience: ExperienceLevel =
    profile?.experience_level === "principiante" ||
    profile?.experience_level === "avanzado"
      ? profile.experience_level
      : "intermedio";

  return { goal, experience };
}

export type ExerciseAlternativeDetail = ExerciseComparison & {
  exercise: BiomechanicalExercise;
};

export async function getExerciseAlternatives(
  input: unknown,
): Promise<
  | { error: string }
  | {
      source: BiomechanicalExercise;
      alternatives: ExerciseAlternativeDetail[];
    }
> {
  const parsed = planExerciseIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data: planExercise } = await supabase
    .from("workout_plan_exercises")
    .select(`exercise_catalog(${BIOMECHANICS_COLUMNS})`)
    .eq("id", parsed.data.planExerciseId)
    .single();
  if (!planExercise?.exercise_catalog) return { error: t.actionFailed };

  const { data: candidates } = await supabase
    .from("exercise_catalog")
    .select(BIOMECHANICS_COLUMNS)
    .is("deleted_at", null)
    .limit(200);

  const source = toBiomechanicalExercise(
    planExercise.exercise_catalog as BiomechanicsRow,
  );

  return {
    source,
    alternatives: rankComparisons(
      source,
      (candidates ?? []).map((row) =>
        toBiomechanicalExercise(row as BiomechanicsRow),
      ),
    ),
  };
}

export type ExerciseDetail = {
  exercise: BiomechanicalExercise;
  setupNotes: string | null;
  executionNotes: string | null;
  ratings: ExerciseRating[];
  /**
   * Esquema sugerido de series, repeticiones, RIR y descanso. Se muestra
   * APARTE y no modifica la rutina: aplicarlo es decision del usuario
   * (requisito 13).
   */
  prescription: Prescription;
};

/**
 * Ficha completa de un ejercicio del plan: datos biomecanicos mas las
 * valoraciones calculadas para el contexto del usuario. Cada valoracion
 * llega con su motivo (requisito 11).
 */
export async function getExerciseDetail(
  input: unknown,
): Promise<{ error: string } | ExerciseDetail> {
  const parsed = planExerciseIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data: planExercise } = await supabase
    .from("workout_plan_exercises")
    .select(`position, exercise_catalog(${BIOMECHANICS_COLUMNS})`)
    .eq("id", parsed.data.planExerciseId)
    .single();
  if (!planExercise?.exercise_catalog) return { error: t.actionFailed };

  const row = planExercise.exercise_catalog as BiomechanicsRow;
  const exercise = toBiomechanicalExercise(row);
  const context = await getRatingContext(user.id);

  const positionInSession = planExercise.position ?? undefined;

  return {
    exercise,
    setupNotes: row.setup_notes ?? null,
    executionNotes: row.execution_notes ?? null,
    ratings: rateExercise(exercise, {
      ...context,
      // `position` ya es 1-indexado en workout_plan_exercises.
      positionInSession,
    }),
    prescription: recommendPrescription(exercise, {
      ...context,
      positionInSession,
    }),
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
