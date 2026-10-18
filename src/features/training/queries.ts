import { createClient } from "@/lib/supabase/server";
import { localDateOf, todayLocalISO, weekBoundsISO } from "@/lib/dates";
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
  exerciseHistory,
  latestRecord,
  muscleFrequency,
  personalRecords,
  sessionVolume,
  type DatedSet,
  type ExerciseHistory,
  type LoggedSet,
  type PersonalRecord,
  type RecordEvent,
} from "@/features/training/lib/stats";

/** Quién escribió la rutina: el coach (importada o a mano) o la IA. */
export type PlanOrigin = "coach" | "ia";

export type PlanSummary = {
  id: string;
  name: string;
  objective: string | null;
  active: boolean;
  origin: PlanOrigin;
  dayCount: number;
};

export type PlanExerciseView = {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  /** Los que ayudan. Alimentan el resaltado de asistentes en el maniqui. */
  secondaryMuscles: string[];
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
  origin: PlanOrigin;
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

export type LiveSet = {
  id: string;
  exerciseId: string;
  setNumber: number;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
};

export type TrainingOverview = {
  plans: PlanSummary[];
  activePlan: PlanDetail | null;
  sessionInProgress: {
    id: string;
    startedAt: string;
    /** El día del plan que se está entrenando; null en una sesión libre. */
    planDayId: string | null;
    /** Lo registrado hasta ahora, en orden. */
    sets: LiveSet[];
  } | null;
  recentSessions: SessionSummary[];
  records: PersonalRecord[];
  muscleSets7d: [string, number][];
  /** Última vez y la anterior, por `exerciseId`. */
  history: Record<string, ExerciseHistory>;
  /** La marca personal más reciente, si la hubo. */
  latestRecord: RecordEvent | null;
  /**
   * Los días del plan ya entrenados esta semana (lunes a domingo, en la zona
   * del usuario): id del día → fecha YYYY-MM-DD de la última vez.
   */
  doneThisWeek: Record<string, string>;
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
      secondary_muscles: string[] | null;
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
      secondaryMuscles: row.exercise_catalog?.secondary_muscles ?? [],
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

/**
 * Lo que de verdad se hizo en cada sesión cuando no fue el ejercicio de la
 * plantilla, con la misma forma que una sustitución del día: así la vista lo
 * superpone igual («en lugar de X») y la plantilla sigue intacta.
 */
async function getSessionSwaps(
  sessionIds: string[],
  date: string,
): Promise<Map<string, ExerciseDaySwapRecord[]>> {
  const bySession = new Map<string, ExerciseDaySwapRecord[]>();
  if (sessionIds.length === 0) return bySession;
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_session_exercises")
    .select(
      "session_id, plan_exercise_id, performed_exercise_id, reason, source, exercise_catalog!workout_session_exercises_performed_exercise_id_fkey(name, primary_muscle, equipment)",
    )
    .in("session_id", sessionIds);
  for (const row of data ?? []) {
    if (!row.plan_exercise_id || !row.exercise_catalog) continue;
    const list = bySession.get(row.session_id) ?? [];
    list.push({
      planExerciseId: row.plan_exercise_id,
      date,
      substituteExerciseId: row.performed_exercise_id,
      substituteName: row.exercise_catalog.name,
      substitutePrimaryMuscle: row.exercise_catalog.primary_muscle,
      substituteEquipment: row.exercise_catalog.equipment,
      reason: row.reason,
      source: row.source === "sugerencia" ? "asistente" : "usuario",
    });
    bySession.set(row.session_id, list);
  }
  return bySession;
}

const PLAN_SELECT =
  "id, name, objective, active, origin, workout_plan_days(id, day_index, name, workout_plan_exercises(id, exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, target_rpe, tempo, rest_seconds, notes, exercise_catalog(name, primary_muscle, secondary_muscles, equipment)))";

type PlanRow = {
  id: string;
  name: string;
  objective: string | null;
  active: boolean;
  origin: string;
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
    origin: plan.origin === "ia" ? "ia" : "coach",
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

/**
 * El día que se está entrenando muestra lo que dice su sesión; los demás,
 * las sustituciones anotadas para hoy.
 */
function withLiveSwaps(
  plan: PlanDetail,
  daySwaps: ExerciseDaySwapRecord[],
  liveSwaps: ExerciseDaySwapRecord[],
  liveDayId: string | null,
  date: string,
): PlanDetail {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: applyExerciseDaySwaps(
        day.exercises,
        day.id === liveDayId ? liveSwaps : daySwaps,
        date,
      ),
    })),
  };
}

/**
 * Detalle de la rutina, con las sustituciones de `date` superpuestas.
 *
 * Se aplican aqui porque esta es la pantalla desde la que se sustituye: si
 * mostrara la plantilla pura, el usuario pulsaria "solo por hoy" y no veria
 * cambiar nada. Lo que evita la confusion no es esconder la sustitucion, es
 * marcarla: cada ejercicio sustituido viaja con su original en `daySwap` y la
 * fila lo dice ("Hoy en lugar de X") junto al boton de volver.
 *
 * El plan guardado sigue intacto: esto se resuelve al leer.
 */
export async function getPlanDetail(
  userId: string,
  planId: string,
  date: string = todayLocalISO(),
): Promise<PlanDetail | null> {
  const supabase = await createClient();
  const [{ data }, daySwaps] = await Promise.all([
    supabase
      .from("workout_plans")
      .select(PLAN_SELECT)
      .eq("id", planId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
    getExerciseDaySwaps(userId, date),
  ]);
  if (!data) return null;
  return withDaySwaps(
    mapPlanDetail(data as unknown as PlanRow),
    daySwaps,
    date,
  );
}

export async function getSessionDetail(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select(
      "id, started_at, completed_at, notes, workout_plans(name), workout_plan_days(name, workout_plan_exercises(id, exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, target_rpe, tempo, rest_seconds, notes, exercise_catalog(name, primary_muscle, secondary_muscles, equipment))), workout_sets(id, exercise_id, set_number, is_warmup, weight_kg, repetitions, rir, rpe, tempo, rest_seconds, notes, created_at, exercise_catalog(name))",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session) return null;

  // La sesion se lee con las sustituciones del dia en que empezo, no las de
  // hoy: revisar el lunes una sesion del sabado debe mostrar lo que se hizo.
  const sessionDate = session.started_at.slice(0, 10);
  const [daySwaps, sessionSwaps] = await Promise.all([
    getExerciseDaySwaps(userId, sessionDate),
    getSessionSwaps([session.id], sessionDate),
  ]);
  /* Las sesiones nuevas guardan su propio cambio; las de antes de que
     existiera, sólo la sustitución del día. */
  const swapsDeLaSesion = sessionSwaps.get(session.id) ?? daySwaps;

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
      swapsDeLaSesion,
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
 */
export async function getTrainingOverview(
  userId: string,
  {
    date = todayLocalISO(),
    timezone = "America/Costa_Rica",
  }: { date?: string; timezone?: string } = {},
): Promise<TrainingOverview> {
  const supabase = await createClient();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  /* La semana se decide en la zona del usuario. Se pide un día de margen
     antes del lunes (en UTC el lunes local puede empezar el domingo) y se
     filtra después por fecha local. */
  const week = weekBoundsISO(date);
  const weekSince = new Date(
    Date.parse(`${week.start}T00:00:00Z`) - 86400000,
  ).toISOString();

  const [
    plansResult,
    activePlanResult,
    inProgressResult,
    sessionsResult,
    setsResult,
    daySwaps,
    weekResult,
  ] = await Promise.all([
    supabase
      .from("workout_plans")
      .select("id, name, objective, active, origin, workout_plan_days(id)")
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
      .select(
        "id, started_at, workout_plan_day_id, workout_sets(id, exercise_id, set_number, is_warmup, weight_kg, repetitions, created_at)",
      )
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
      // Las más recientes: el tope no puede dejar fuera la última sesión.
      .order("created_at", { ascending: false })
      .limit(1000),
    getExerciseDaySwaps(userId, date),
    supabase
      .from("workout_sessions")
      .select("workout_plan_day_id, completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .not("workout_plan_day_id", "is", null)
      .gte("completed_at", weekSince)
      .order("completed_at", { ascending: true }),
  ]);

  const liveSwaps = inProgressResult.data?.workout_plan_day_id
    ? ((await getSessionSwaps([inProgressResult.data.id], date)).get(
        inProgressResult.data.id,
      ) ?? [])
    : [];

  const doneThisWeek: Record<string, string> = {};
  for (const row of weekResult.data ?? []) {
    const day = localDateOf(row.completed_at!, timezone);
    if (day >= week.start && day <= week.end && row.workout_plan_day_id)
      doneThisWeek[row.workout_plan_day_id] = day;
  }

  const allSets: LoggedSet[] = (setsResult.data ?? []).map((set) => ({
    exerciseId: set.exercise_id,
    exerciseName: set.exercise_catalog?.name ?? "",
    primaryMuscle: set.exercise_catalog?.primary_muscle ?? "",
    isWarmup: set.is_warmup,
    weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
    repetitions: set.repetitions,
  }));
  const datedSets: DatedSet[] = (setsResult.data ?? []).map((set, i) => ({
    ...allSets[i]!,
    createdAt: set.created_at,
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
      origin: plan.origin === "ia" ? "ia" : "coach",
      dayCount: (plan.workout_plan_days ?? []).length,
    })),
    activePlan: activePlanResult.data
      ? withLiveSwaps(
          mapPlanDetail(activePlanResult.data as unknown as PlanRow),
          daySwaps,
          liveSwaps,
          inProgressResult.data?.workout_plan_day_id ?? null,
          date,
        )
      : null,
    sessionInProgress: inProgressResult.data
      ? {
          id: inProgressResult.data.id,
          startedAt: inProgressResult.data.started_at,
          planDayId: inProgressResult.data.workout_plan_day_id,
          sets: [...(inProgressResult.data.workout_sets ?? [])]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((set) => ({
              id: set.id,
              exerciseId: set.exercise_id,
              setNumber: set.set_number,
              isWarmup: set.is_warmup,
              weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
              repetitions: set.repetitions,
            })),
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
    history: Object.fromEntries(exerciseHistory(datedSets)),
    latestRecord: latestRecord(datedSets),
    doneThisWeek,
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
          rir:
            exercise.target_rir === null ? null : Number(exercise.target_rir),
          systemicFatigue: exercise.exercise_catalog!.systemic_fatigue,
        })),
    }));

  return analyzeRoutine(days);
}

// ------------------------------------------------------------- catalogo

export type CatalogoFiltros = {
  query?: string;
  muscle?: string;
  equipment?: string;
  /** Pagina empezando en 1. */
  page?: number;
};

export type CatalogoEjercicio = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string | null;
  instructions: string | null;
  isUnilateral: boolean;
  /** Si trae biomecanica escrita, que es lo que la comparacion necesita. */
  curated: boolean;
};

export const CATALOGO_POR_PAGINA = 24;

/**
 * El catalogo entero, paginado.
 *
 * Pagina en el servidor con `range` en vez de traerlo todo: son 1.339 filas y
 * de aqui saldran mas. La cuenta viene en la misma peticion (`count: exact`),
 * asi que la paginacion no cuesta un viaje extra.
 *
 * Los vocabularios —musculos y equipo— NO se declaran en codigo: se leen de lo
 * que hay en la tabla. El catalogo crece por importacion, y una lista escrita
 * a mano se quedaria corta el dia que entre un termino nuevo.
 */
export async function getExerciseCatalog(filtros: CatalogoFiltros): Promise<{
  exercises: CatalogoEjercicio[];
  total: number;
  muscles: string[];
  equipment: string[];
}> {
  const supabase = await createClient();
  const page = Math.max(1, filtros.page ?? 1);
  const desde = (page - 1) * CATALOGO_POR_PAGINA;

  let consulta = supabase
    .from("exercise_catalog")
    .select(
      "id, name, primary_muscle, secondary_muscles, equipment, instructions, is_unilateral, resistance_profile",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (filtros.query) consulta = consulta.ilike("name", `%${filtros.query}%`);
  if (filtros.muscle) consulta = consulta.eq("primary_muscle", filtros.muscle);
  if (filtros.equipment) consulta = consulta.eq("equipment", filtros.equipment);

  const [{ data, count }, { data: vocabulario }] = await Promise.all([
    consulta.order("name").range(desde, desde + CATALOGO_POR_PAGINA - 1),
    supabase
      .from("exercise_catalog")
      .select("primary_muscle, equipment")
      .is("deleted_at", null),
  ]);

  const musculos = new Set<string>();
  const equipos = new Set<string>();
  for (const fila of vocabulario ?? []) {
    if (fila.primary_muscle) musculos.add(fila.primary_muscle);
    if (fila.equipment) equipos.add(fila.equipment);
  }

  return {
    exercises: (data ?? []).map((fila) => ({
      id: fila.id,
      name: fila.name,
      primaryMuscle: fila.primary_muscle,
      secondaryMuscles: fila.secondary_muscles ?? [],
      equipment: fila.equipment,
      instructions: fila.instructions,
      isUnilateral: fila.is_unilateral,
      curated: fila.resistance_profile !== null,
    })),
    total: count ?? 0,
    muscles: [...musculos].sort((a, b) => a.localeCompare(b, "es")),
    equipment: [...equipos].sort((a, b) => a.localeCompare(b, "es")),
  };
}

export type BibliotecaEjercicio = CatalogoEjercicio & {
  imageUrl: string | null;
  /** Si está en alguna rutina tuya: la tarjeta lo dice. */
  inRoutine: boolean;
};

/**
 * La biblioteca de ejercicios: el catálogo con foto, filtrado por grupo
 * muscular, equipo, nombre y colección (todos, los de tus rutinas o los que
 * registraste hace poco).
 *
 * Las colecciones se resuelven a una lista de ids antes de consultar el
 * catálogo: así la paginación y la cuenta siguen saliendo de una sola
 * petición. Los ids de tus rutinas se piden siempre, porque además marcan
 * las tarjetas.
 */
export async function getExerciseLibrary(
  userId: string,
  filtros: {
    query?: string;
    muscles?: readonly string[];
    equipment?: string;
    collection: "todos" | "rutinas" | "recientes";
    page?: number;
  },
): Promise<{
  exercises: BibliotecaEjercicio[];
  total: number;
  equipment: string[];
}> {
  const supabase = await createClient();
  const page = Math.max(1, filtros.page ?? 1);
  const desde = (page - 1) * CATALOGO_POR_PAGINA;

  const [{ data: planes }, recientes, { data: vocabulario }] =
    await Promise.all([
      supabase
        .from("workout_plans")
        .select("workout_plan_days(workout_plan_exercises(exercise_id))")
        .eq("user_id", userId)
        .is("deleted_at", null),
      filtros.collection === "recientes"
        ? supabase
            .from("workout_sessions")
            .select("workout_sets(exercise_id)")
            .eq("user_id", userId)
            .order("started_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: null }),
      supabase
        .from("exercise_catalog")
        .select("equipment")
        .is("deleted_at", null),
    ]);

  const enRutinas = new Set(
    (planes ?? []).flatMap((plan) =>
      (plan.workout_plan_days ?? []).flatMap((day) =>
        (day.workout_plan_exercises ?? []).map((e) => e.exercise_id),
      ),
    ),
  );
  const ids =
    filtros.collection === "rutinas"
      ? [...enRutinas]
      : filtros.collection === "recientes"
        ? [
            ...new Set(
              (recientes.data ?? []).flatMap((sesion) =>
                (sesion.workout_sets ?? []).map((set) => set.exercise_id),
              ),
            ),
          ]
        : null;

  const equipos = [
    ...new Set(
      (vocabulario ?? []).map((fila) => fila.equipment).filter(Boolean),
    ),
  ] as string[];
  const vacio = {
    exercises: [],
    total: 0,
    equipment: equipos.sort((a, b) => a.localeCompare(b, "es")),
  };
  if (ids && ids.length === 0) return vacio;

  let consulta = supabase
    .from("exercise_catalog")
    .select(
      "id, name, primary_muscle, secondary_muscles, equipment, instructions, is_unilateral, resistance_profile, image_url",
      { count: "exact" },
    )
    .is("deleted_at", null);
  if (ids) consulta = consulta.in("id", ids);
  if (filtros.query) consulta = consulta.ilike("name", `%${filtros.query}%`);
  if (filtros.muscles?.length)
    consulta = consulta.in("primary_muscle", [...filtros.muscles]);
  if (filtros.equipment) consulta = consulta.eq("equipment", filtros.equipment);

  const { data, count } = await consulta
    .order("name")
    .range(desde, desde + CATALOGO_POR_PAGINA - 1);

  return {
    ...vacio,
    exercises: (data ?? []).map((fila) => ({
      id: fila.id,
      name: fila.name,
      primaryMuscle: fila.primary_muscle,
      secondaryMuscles: fila.secondary_muscles ?? [],
      equipment: fila.equipment,
      instructions: fila.instructions,
      isUnilateral: fila.is_unilateral,
      curated: fila.resistance_profile !== null,
      imageUrl: fila.image_url,
      inRoutine: enRutinas.has(fila.id),
    })),
    total: count ?? 0,
  };
}

export type LogSet = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  equipment: string | null;
  setNumber: number;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
  rir: number | null;
  createdAt: string;
};

export type LogSession = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  planName: string | null;
  dayName: string | null;
  dayIndex: number | null;
  sets: LogSet[];
  /** Ejercicio realizado → el de la rutina al que reemplazó en esa sesión. */
  replaced: Record<string, string>;
};

/**
 * Todo lo entrenado, serie por serie: la base del historial.
 *
 * Se piden las sesiones terminadas con sus series en una consulta; la vista
 * por ejercicio («todas mis series de press banca») se arma en el cliente a
 * partir de esto, para que buscar no vuelva al servidor en cada letra. El
 * tope de 300 sesiones son años de entrenamiento a cuatro por semana.
 */
export async function getTrainingLog(userId: string): Promise<LogSession[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(
      "id, started_at, completed_at, workout_plans(name), workout_plan_days(name, day_index), workout_sets(exercise_id, set_number, is_warmup, weight_kg, repetitions, rir, created_at, exercise_catalog(name, primary_muscle, equipment))",
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(300);

  /* Qué reemplazó a qué, por sesión: el historial lo marca al lado de cada
     ejercicio. */
  const { data: cambios } = await supabase
    .from("workout_session_exercises")
    .select(
      "session_id, performed_exercise_id, exercise_catalog!workout_session_exercises_original_exercise_id_fkey(name)",
    )
    .eq("user_id", userId);
  const replaced = new Map<string, Record<string, string>>();
  for (const c of cambios ?? []) {
    if (!c.exercise_catalog) continue;
    const porSesion = replaced.get(c.session_id) ?? {};
    porSesion[c.performed_exercise_id] = c.exercise_catalog.name;
    replaced.set(c.session_id, porSesion);
  }

  return (data ?? []).map((session) => ({
    id: session.id,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    dayIndex: session.workout_plan_days?.day_index ?? null,
    replaced: replaced.get(session.id) ?? {},
    durationMinutes: session.completed_at
      ? Math.max(
          1,
          Math.round(
            (Date.parse(session.completed_at) -
              Date.parse(session.started_at)) /
              60000,
          ),
        )
      : null,
    planName: session.workout_plans?.name ?? null,
    dayName: session.workout_plan_days?.name ?? null,
    sets: [...(session.workout_sets ?? [])]
      .sort(
        (a, b) =>
          a.created_at.localeCompare(b.created_at) ||
          a.set_number - b.set_number,
      )
      .map((set) => ({
        exerciseId: set.exercise_id,
        exerciseName: set.exercise_catalog?.name ?? "Ejercicio",
        primaryMuscle: set.exercise_catalog?.primary_muscle ?? "",
        equipment: set.exercise_catalog?.equipment ?? null,
        setNumber: set.set_number,
        isWarmup: set.is_warmup,
        weightKg: set.weight_kg !== null ? Number(set.weight_kg) : null,
        repetitions: set.repetitions,
        rir: set.rir !== null ? Number(set.rir) : null,
        createdAt: set.created_at,
      })),
  }));
}
