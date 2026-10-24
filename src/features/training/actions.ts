"use server";

import { loadExerciseCatalog } from "@/features/training/catalog-cache";
import { searchExerciseCatalog } from "@/features/training/lib/exercise-matcher";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import { todayInTimezone } from "@/lib/dates";
import { FLAGS } from "@/lib/flags";
import { shortSummary } from "@/features/training/lib/exercise-summary";
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
  catalogExerciseIdSchema,
  planExerciseIdSchema,
  planIdSchema,
  searchExercisesSchema,
  sessionIdSchema,
  sessionPauseSchema,
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

/**
 * Sustitucion PERMANENTE en el plan: reescribe `workout_plan_exercises`.
 *
 * Ya NO es la accion por defecto. Antes, cambiar un ejercicio porque la
 * maquina estaba ocupada destruia la rutina original para siempre, y eso
 * contradice el principio de que el plan base no se pierde (ADR-002, RF-002).
 * Para eso esta ahora `swapPlanExerciseForDay`, que no toca el plan.
 *
 * Esta funcion sobrevive para el caso legitimo de "este ejercicio ya no va en
 * mi rutina", y exige `confirmPlanRewrite: true` para no invocarse por error.
 */
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
  const { user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  /* Se busca en el catálogo entero con el vocabulario traducido: el
     catálogo está casi todo en inglés y «remo mancuerna» tiene que
     encontrar «One-Arm Dumbbell Row». */
  try {
    const catalog = await loadExerciseCatalog();
    const byId = new Map(catalog.map((row) => [row.id, row]));
    const results = searchExerciseCatalog(parsed.data.term, catalog).map(
      (match) => toCatalogExercise(byId.get(match.id) as ExerciseRow),
    );
    return { results };
  } catch {
    return { error: t.actionFailed };
  }
}

/** Columnas biomecanicas del catalogo, usadas por la ficha y la comparacion. */
const BIOMECHANICS_COLUMNS =
  "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, joints, resistance_profile, hardest_point, stability, range_of_motion, technical_demand, systemic_fatigue, progression_ease, is_unilateral, common_errors, technique_cues, setup_notes, execution_notes, image_url, image_end_url, summary, instructions";

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
  summary?: string | null;
  instructions?: string | null;
};

function toBiomechanicalExercise(row: BiomechanicsRow): BiomechanicalExercise {
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

export async function getExerciseAlternatives(input: unknown): Promise<
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

  /* Candidatos: solo los que tienen biomecanica escrita.
     El catalogo importado entra sin ella, y el comparador sustituye cada valor
     ausente por una puntuacion media —no falla, pero deja que un ejercicio del
     que no sabemos nada adelante a uno con datos reales—. Y el `limit` sin
     orden dejaba de ser inocuo al pasar de 15 filas a 1.339: cuales eran esas
     200 lo decidia el orden fisico de la tabla. */
  const { data: candidates } = await supabase
    .from("exercise_catalog")
    .select(BIOMECHANICS_COLUMNS)
    .is("deleted_at", null)
    .not("resistance_profile", "is", null)
    .order("name")
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
  /**
   * Nulos cuando el ejercicio no tiene biomecanica escrita. Un ejercicio
   * importado no la trae, y el motor rellena cada hueco con una puntuacion
   * media: enseñar "5/10" en las seis dimensiones seria inventarse una lectura
   * y presentarla con la misma cara que una real.
   */
  ratings: ExerciseRating[] | null;
  /**
   * Esquema sugerido de series, repeticiones, RIR y descanso. Se muestra
   * APARTE y no modifica la rutina: aplicarlo es decision del usuario
   * (requisito 13).
   */
  prescription: Prescription | null;
  /** «Cómo se hace», en dos o tres líneas. */
  summary: string | null;
  /**
   * El mayor peso que el usuario movió en este ejercicio (sin calentamiento).
   * Nulo mientras `FLAGS.exercisePersonalBest` esté apagado.
   */
  personalBest: {
    weightKg: number;
    repetitions: number | null;
    date: string;
  } | null;
};

/** Mayor peso efectivo del usuario en un ejercicio, desde sus sesiones. */
async function personalBestFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exerciseId: string,
): Promise<ExerciseDetail["personalBest"]> {
  if (!FLAGS.exercisePersonalBest) return null;
  const { data } = await supabase
    .from("workout_sets")
    .select(
      "weight_kg, repetitions, created_at, workout_sessions!inner(user_id)",
    )
    .eq("workout_sessions.user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("is_warmup", false)
    .not("weight_kg", "is", null)
    .order("weight_kg", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.weight_kg != null
    ? {
        weightKg: Number(data.weight_kg),
        repetitions: data.repetitions,
        date: data.created_at,
      }
    : null;
}

async function fichaCorta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  row: BiomechanicsRow,
) {
  return {
    summary: shortSummary(row),
    personalBest: await personalBestFor(supabase, userId, row.id),
  };
}

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
    ...(await fichaCorta(supabase, user.id, row)),
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

/**
 * La misma ficha, pero pedida desde el catalogo.
 *
 * Cambia una cosa y no es menor: sin plan no hay `positionInSession`, y esa
 * posicion es lo que ajusta la prescripcion —el quinto ejercicio de una sesion
 * no se prescribe como el primero—. Aqui se omite, asi que lo que se ve es la
 * lectura del ejercicio EN ABSTRACTO, no la de tu sesion de hoy.
 */
export async function getCatalogExerciseDetail(
  input: unknown,
): Promise<{ error: string } | ExerciseDetail> {
  const parsed = catalogExerciseIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data } = await supabase
    .from("exercise_catalog")
    .select(BIOMECHANICS_COLUMNS)
    .eq("id", parsed.data.exerciseId)
    .is("deleted_at", null)
    .single();
  if (!data) return { error: t.actionFailed };

  const row = data as BiomechanicsRow;
  const exercise = toBiomechanicalExercise(row);

  /* Sin biomecanica no hay lectura que dar. Se devuelven nulos y la ficha
     explica por que, en vez de mostrar seises inventados. */
  if (row.resistance_profile === null) {
    return {
      ...(await fichaCorta(supabase, user.id, row)),
      exercise,
      setupNotes: row.setup_notes ?? null,
      executionNotes: row.execution_notes ?? null,
      ratings: null,
      prescription: null,
    };
  }

  const context = await getRatingContext(user.id);

  return {
    ...(await fichaCorta(supabase, user.id, row)),
    exercise,
    setupNotes: row.setup_notes ?? null,
    executionNotes: row.execution_notes ?? null,
    ratings: rateExercise(exercise, context),
    prescription: recommendPrescription(exercise, context),
  };
}

// --------------------------------------------------------------- sesiones

/**
 * Lo que se sustituyó antes de empezar (anotado para hoy) pasa a la sesión
 * al crearla: desde ahí, la sesión es la que dice qué se hizo. La plantilla
 * no se toca. Si la copia falla, la sesión sigue: se entrena el original.
 */
async function carrySwapsIntoSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
  planDayId: string,
) {
  const [{ data: profile }, { data: dayExercises }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
    supabase
      .from("workout_plan_exercises")
      .select("id, exercise_id")
      .eq("workout_plan_day_id", planDayId),
  ]);
  const original = new Map(
    (dayExercises ?? []).map((e) => [e.id, e.exercise_id]),
  );
  if (original.size === 0) return;
  const { data: swaps } = await supabase
    .from("exercise_day_swaps")
    .select("plan_exercise_id, substitute_exercise_id, reason, source")
    .eq("user_id", userId)
    .eq("date", todayInTimezone(profile?.timezone ?? "America/Costa_Rica"))
    .in("plan_exercise_id", [...original.keys()]);
  const rows = (swaps ?? [])
    .filter(
      (s) => original.get(s.plan_exercise_id) !== s.substitute_exercise_id,
    )
    .map((s) => ({
      user_id: userId,
      session_id: sessionId,
      plan_exercise_id: s.plan_exercise_id,
      original_exercise_id: original.get(s.plan_exercise_id)!,
      performed_exercise_id: s.substitute_exercise_id,
      source: s.source === "asistente" ? "sugerencia" : "usuario",
      reason: s.reason,
    }));
  if (rows.length)
    await supabase.from("workout_session_exercises").insert(rows);
}

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
  /* Una sesión de un día del plan se entrena en la misma pantalla de
     Entrenamiento, sobre las tarjetas del día. La sesión libre, sin plan
     que seguir, sigue en su propia pantalla para ir añadiendo ejercicios. */
  if (inProgress)
    redirect(
      parsed.data.planDayId
        ? "/entrenamiento"
        : `/entrenamiento/sesion/${inProgress.id}`,
    );

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
  if (parsed.data.planDayId)
    await carrySwapsIntoSession(
      supabase,
      user.id,
      created.id,
      parsed.data.planDayId,
    );
  revalidateTraining();
  redirect(
    parsed.data.planDayId
      ? "/entrenamiento"
      : `/entrenamiento/sesion/${created.id}`,
  );
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
  redirect(parsed.data.returnTo ?? "/entrenamiento");
}

/**
 * Suma una pausa a la sesion en curso, para que su duracion no la cuente.
 * La envia la vista movil al reanudar.
 */
export async function addSessionPause(
  input: unknown,
): Promise<TrainingActionResult> {
  const parsed = sessionPauseSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("paused_seconds")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .is("completed_at", null)
    .maybeSingle();
  if (!session) return fail;

  const { error } = await supabase
    .from("workout_sessions")
    .update({ paused_seconds: session.paused_seconds + parsed.data.seconds })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id);
  if (error) return fail;
  return { success: true };
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
