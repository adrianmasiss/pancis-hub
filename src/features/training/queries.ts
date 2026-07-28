import { createClient } from "@/lib/supabase/server";
import { todayLocalISO } from "@/lib/dates";
import {
  applyExerciseDaySwaps,
  type DaySwapOrigin,
  type ExerciseDaySwapRecord,
} from "@/features/training/lib/day-swaps";
import {
  analyzeRoutine,
  type RoutineAnalysis,
  type RoutineDay,
} from "@/features/training/lib/routine-analysis";
import {
  effectiveSetCount,
  muscleFrequency,
  personalRecords,
  sessionVolume,
  type LoggedSet,
  type PersonalRecord,
} from "@/features/training/lib/stats";

export type PlanSummary = {
  id: string;
  name: string;
  objective: string | null;
  active: boolean;
  dayCount: number;
};

export type PlanExerciseView = {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  equipment: string | null;
  position: number;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  rpe: number | null;
  tempo: string | null;
  restSeconds: number | null;
  notes: string | null;
  /**
   * Si hoy este ejercicio esta sustituido, aqui viaja el original. El plan
   * guardado NO cambia: la sustitucion se aplica al leer.
   */
  daySwap: DaySwapOrigin | null;
};

export type PlanDayView = {
  id: string;
  dayIndex: number;
  name: string | null;
  exercises: PlanExerciseView[];
};

export type PlanDetail = {
  id: string;
  name: string;
  objective: string | null;
  active: boolean;
  days: PlanDayView[];
};

export type SessionSetView = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
  rir: number | null;
  rpe: number | null;
  tempo: string | null;
  restSeconds: number | null;
  notes: string | null;
};

export type SessionDetail = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  planName: string | null;
  dayName: string | null;
  /** Ejercicios guia del dia del plan (si la sesion nacio de un plan). */
  plannedExercises: PlanExerciseView[];
  sets: SessionSetView[];
};

export type SessionSummary = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  planDayId: string | null;
  planName: string | null;
  setsCount: number;
  volume: number;
  durationMinutes: number | null;
};

export type TrainingOverview = {
  plans: PlanSummary[];
  activePlan: PlanDetail | null;
  sessionInProgress: { id: string; startedAt: string } | null;
  recentSessions: SessionSummary[];
  records: PersonalRecord[];
  muscleSets7d: [string, number][];
};

function mapPlanExercises(
  rows: {
    id: string;
    exercise_id: string;
    position: number;
    sets: number | null;
    target_reps_min: number | null;
    target_reps_max: number | null;
    target_rir: number | null;
    target_rpe: number | null;
    tempo: string | null;
    rest_seconds: number | null;
    notes: string | null;
    exercise_catalog: {
      name: string;
      primary_muscle: string;
      equipment: string | null;
    } | null;
  }[],
): PlanExerciseView[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      name: row.exercise_catalog?.name ?? "",
      primaryMuscle: row.exercise_catalog?.primary_muscle ?? "",
      equipment: row.exercise_catalog?.equipment ?? null,
      position: row.position,
      sets: row.sets,
      repsMin: row.target_reps_min,
      repsMax: row.target_reps_max,
      rir: row.target_rir !== null ? Number(row.target_rir) : null,
      rpe: row.target_rpe !== null ? Number(row.target_rpe) : null,
      tempo: row.tempo,
      restSeconds: row.rest_seconds,
      notes: row.notes,
      // Sin sustitucion hasta que se apliquen las del dia. Nunca se omite el
      // campo para que quien consuma esto no tenga que distinguir dos formas.
      daySwap: null,
    }));
}

/**
 * Sustituciones vigentes del usuario para una fecha, ya resueltas contra el
 * catalogo. Se consultan aparte del plan porque viven en su propia tabla: el
 * plan guardado no sabe nada de ellas.
 */
async function getExerciseDaySwaps(
  userId: string,
  date: string,
): Promise<ExerciseDaySwapRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_day_swaps")
    .select(
      "plan_exercise_id, date, substitute_exercise_id, reason, source, exercise_catalog(name, primary_muscle, equipment)",
    )
    .eq("user_id", userId)
    .eq("date", date);

  return (data ?? [])
    .filter((row) => row.exercise_catalog !== null)
    .map((row) => ({
      planExerciseId: row.plan_exercise_id,
      date: row.date,
      substituteExerciseId: row.substitute_exercise_id,
      substituteName: row.exercise_catalog!.name,
      substitutePrimaryMuscle: row.exercise_catalog!.primary_muscle,
      substituteEquipment: row.exercise_catalog!.equipment,
      reason: row.reason,
      source: row.source as "usuario" | "asistente",
    }));
}

const PLAN_SELECT =
  "id, name, objective, active, workout_plan_days(id, day_index, name, workout_plan_exercises(id, exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, target_rpe, tempo, rest_seconds, notes, exercise_catalog(name, primary_muscle, equipment)))";

type PlanRow = {
  id: string;
  name: string;
  objective: string | null;
  active: boolean;
  workout_plan_days: {
    id: string;
    day_index: number;
    name: string | null;
    workout_plan_exercises: Parameters<typeof mapPlanExercises>[0];
  }[];
};

function mapPlanDetail(plan: PlanRow): PlanDetail {
  return {
    id: plan.id,
    name: plan.name,
    objective: plan.objective,
    active: plan.active,
    days: [...plan.workout_plan_days]
      .sort((a, b) => a.day_index - b.day_index)
      .map((day) => ({
        id: day.id,
        dayIndex: day.day_index,
        name: day.name,
        exercises: mapPlanExercises(day.workout_plan_exercises),
      })),
  };
}

/** Superpone las sustituciones del dia sobre cada dia del plan. */
function withDaySwaps(
  plan: PlanDetail,
  swaps: ExerciseDaySwapRecord[],
  date: string,
): PlanDetail {
  if (swaps.length === 0) return plan;
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: applyExerciseDaySwaps(day.exercises, swaps, date),
    })),
  };
}

export async function getPlanDetail(
  userId: string,
  planId: string,
): Promise<PlanDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_plans")
    .select(PLAN_SELECT)
    .eq("id", planId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return data ? mapPlanDetail(data as unknown as PlanRow) : null;
}

export async function getSessionDetail(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select(
      "id, started_at, completed_at, notes, workout_plans(name), workout_plan_days(name, workout_plan_exercises(id, exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, target_rpe, tempo, rest_seconds, notes, exercise_catalog(name, primary_muscle, equipment))), workout_sets(id, exercise_id, set_number, is_warmup, weight_kg, repetitions, rir, rpe, tempo, rest_seconds, notes, created_at, exercise_catalog(name))",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session) return null;

  // La sesion se lee con las sustituciones del dia en que empezo, no las de
  // hoy: revisar el lunes una sesion del sabado debe mostrar lo que se hizo.
  const sessionDate = session.started_at.slice(0, 10);
  const daySwaps = await getExerciseDaySwaps(userId, sessionDate);

  return {
    id: session.id,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    notes: session.notes,
    planName: session.workout_plans?.name ?? null,
    dayName: session.workout_plan_days?.name ?? null,
    plannedExercises: applyExerciseDaySwaps(
      mapPlanExercises(
        (session.workout_plan_days?.workout_plan_exercises ?? []) as Parameters<
          typeof mapPlanExercises
        >[0],
      ),
      daySwaps,
      sessionDate,
    ),
    sets: [...(session.workout_sets ?? [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((set) => ({
        id: set.id,
        exerciseId: set.exercise_id,
        exerciseName: set.exercise_catalog?.name ?? "",
        setNumber: set.set_number,
        isWarmup: set.is_warmup,
        weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
        repetitions: set.repetitions,
        rir: set.rir !== null ? Number(set.rir) : null,
        rpe: set.rpe !== null ? Number(set.rpe) : null,
        tempo: set.tempo,
        restSeconds: set.rest_seconds,
        notes: set.notes,
      })),
  };
}

/**
 * `date` decide que sustituciones del dia se aplican al plan activo. El plan
 * guardado nunca cambia: se lee tal cual y la excepcion se superpone.
 *
 * Ojo: `getPlanDetail` NO aplica sustituciones a proposito. Esa vista es el
 * editor de la rutina y debe mostrar la plantilla real, no como se ve hoy.
 */
export async function getTrainingOverview(
  userId: string,
  date: string = todayLocalISO(),
): Promise<TrainingOverview> {
  const supabase = await createClient();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    plansResult,
    activePlanResult,
    inProgressResult,
    sessionsResult,
    setsResult,
    daySwaps,
  ] = await Promise.all([
    supabase
      .from("workout_plans")
      .select("id, name, objective, active, workout_plan_days(id)")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_plans")
      .select(PLAN_SELECT)
      .eq("user_id", userId)
      .eq("active", true)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, started_at")
      .eq("user_id", userId)
      .is("completed_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select(
        "id, started_at, completed_at, workout_plan_day_id, workout_plans(name), workout_sets(is_warmup, weight_kg, repetitions)",
      )
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("workout_sets")
      .select(
        "exercise_id, is_warmup, weight_kg, repetitions, created_at, exercise_catalog(name, primary_muscle), workout_sessions!inner(user_id)",
      )
      .eq("workout_sessions.user_id", userId)
      .limit(1000),
    getExerciseDaySwaps(userId, date),
  ]);

  const allSets: LoggedSet[] = (setsResult.data ?? []).map((set) => ({
    exerciseId: set.exercise_id,
    exerciseName: set.exercise_catalog?.name ?? "",
    primaryMuscle: set.exercise_catalog?.primary_muscle ?? "",
    isWarmup: set.is_warmup,
    weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
    repetitions: set.repetitions,
  }));
  const recentSets = (setsResult.data ?? [])
    .filter((set) => set.created_at >= since7)
    .map((set) => ({
      exerciseId: set.exercise_id,
      primaryMuscle: set.exercise_catalog?.primary_muscle ?? "",
      isWarmup: set.is_warmup,
      weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
      repetitions: set.repetitions,
    }));

  return {
    plans: (plansResult.data ?? []).map((plan) => ({
      id: plan.id,
      name: plan.name,
      objective: plan.objective,
      active: plan.active,
      dayCount: (plan.workout_plan_days ?? []).length,
    })),
    activePlan: activePlanResult.data
      ? withDaySwaps(
          mapPlanDetail(activePlanResult.data as unknown as PlanRow),
          daySwaps,
          date,
        )
      : null,
    sessionInProgress: inProgressResult.data
      ? {
          id: inProgressResult.data.id,
          startedAt: inProgressResult.data.started_at,
        }
      : null,
    recentSessions: (sessionsResult.data ?? []).map((session) => {
      const sets: LoggedSet[] = (session.workout_sets ?? []).map((set) => ({
        exerciseId: "",
        isWarmup: set.is_warmup,
        weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
        repetitions: set.repetitions,
      }));
      const durationMinutes = session.completed_at
        ? Math.max(
            1,
            Math.round(
              (Date.parse(session.completed_at) -
                Date.parse(session.started_at)) /
                60000,
            ),
          )
        : null;
      return {
        id: session.id,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        planDayId: session.workout_plan_day_id,
        planName: session.workout_plans?.name ?? null,
        setsCount: effectiveSetCount(sets),
        volume: sessionVolume(sets),
        durationMinutes,
      };
    }),
    records: personalRecords(allSets).slice(0, 5),
    muscleSets7d: [...muscleFrequency(recentSets).entries()],
  };
}

/**
 * Analisis completo de una rutina (requisito 14). Se consulta aparte del
 * detalle del plan porque necesita datos biomecanicos que la vista de
 * edicion no usa.
 */
export async function getRoutineAnalysis(
  userId: string,
  planId: string,
): Promise<RoutineAnalysis | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("workout_plans")
    .select(
      "id, workout_plan_days(day_index, name, workout_plan_exercises(position, sets, target_reps_min, target_reps_max, target_rir, exercise_catalog(name, primary_muscle, secondary_muscles, movement_pattern, systemic_fatigue)))",
    )
    .eq("id", planId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;

  type AnalysisRow = {
    workout_plan_days: {
      day_index: number;
      name: string | null;
      workout_plan_exercises: {
        position: number;
        sets: number | null;
        target_reps_min: number | null;
        target_reps_max: number | null;
        target_rir: number | null;
        exercise_catalog: {
          name: string;
          primary_muscle: string;
          secondary_muscles: string[] | null;
          movement_pattern: string | null;
          systemic_fatigue: number | null;
        } | null;
      }[];
    }[];
  };

  const days: RoutineDay[] = (data as unknown as AnalysisRow).workout_plan_days
    .sort((a, b) => a.day_index - b.day_index)
    .map((day) => ({
      dayIndex: day.day_index,
      name: day.name,
      exercises: day.workout_plan_exercises
        .filter((exercise) => exercise.exercise_catalog !== null)
        .map((exercise) => ({
          name: exercise.exercise_catalog!.name,
          primaryMuscle: exercise.exercise_catalog!.primary_muscle,
          secondaryMuscles: exercise.exercise_catalog!.secondary_muscles ?? [],
          movementPattern: exercise.exercise_catalog!.movement_pattern,
          position: exercise.position,
          sets: exercise.sets,
          repsMin: exercise.target_reps_min,
          repsMax: exercise.target_reps_max,
          rir: exercise.target_rir === null ? null : Number(exercise.target_rir),
          systemicFatigue: exercise.exercise_catalog!.systemic_fatigue,
        })),
    }));

  return analyzeRoutine(days);
}
