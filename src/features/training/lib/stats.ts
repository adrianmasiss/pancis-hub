/**
 * Calculos puros de estadisticas de entrenamiento.
 * El volumen se define como peso x repeticiones de las series efectivas
 * (los calentamientos no cuentan).
 */

export type LoggedSet = {
  exerciseId: string;
  exerciseName?: string;
  primaryMuscle?: string;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
};

/** Volumen total (kg x reps) de las series efectivas. */
export function sessionVolume(sets: LoggedSet[]): number {
  return Math.round(
    sets
      .filter((set) => !set.isWarmup)
      .reduce(
        (total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0),
        0,
      ),
  );
}

export function effectiveSetCount(sets: LoggedSet[]): number {
  return sets.filter((set) => !set.isWarmup).length;
}

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  repetitions: number;
};

/**
 * Mejor marca por ejercicio: la serie efectiva con mayor peso; a igual
 * peso gana la de mas repeticiones.
 */
export function personalRecords(sets: LoggedSet[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const set of sets) {
    if (set.isWarmup || set.weightKg === null || set.repetitions === null)
      continue;
    const current = best.get(set.exerciseId);
    if (
      !current ||
      set.weightKg > current.weightKg ||
      (set.weightKg === current.weightKg &&
        set.repetitions > current.repetitions)
    ) {
      best.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName ?? "",
        weightKg: set.weightKg,
        repetitions: set.repetitions,
      });
    }
  }
  return [...best.values()].sort((a, b) => b.weightKg - a.weightKg);
}

/** Series efectivas por musculo principal (para frecuencia semanal). */
export function muscleFrequency(sets: LoggedSet[]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const set of sets) {
    if (set.isWarmup || !set.primaryMuscle) continue;
    frequency.set(
      set.primaryMuscle,
      (frequency.get(set.primaryMuscle) ?? 0) + 1,
    );
  }
  return new Map([...frequency.entries()].sort((a, b) => b[1] - a[1]));
}

export type DatedSet = LoggedSet & { createdAt: string };

export type ExerciseHistory = {
  /** La serie más pesada de la última vez que se hizo el ejercicio. */
  last: { weightKg: number; repetitions: number; date: string } | null;
  /** Lo anterior a `last`, para decir «+2,5 kg frente a la última vez». */
  previous: { weightKg: number; repetitions: number; date: string } | null;
};

/**
 * Qué se levantó la última vez en cada ejercicio, y la vez anterior.
 *
 * «Una vez» es un día: las series de un mismo día son la misma sesión. De
 * cada día cuenta la serie efectiva más pesada, que es la que alguien
 * recuerda («la última vez hice 80»).
 */
export function exerciseHistory(
  sets: DatedSet[],
): Map<string, ExerciseHistory> {
  const byDay = new Map<
    string,
    Map<string, { weightKg: number; repetitions: number }>
  >();
  for (const set of sets) {
    if (set.isWarmup || set.weightKg === null || set.repetitions === null)
      continue;
    const day = set.createdAt.slice(0, 10);
    const days = byDay.get(set.exerciseId) ?? new Map();
    const top = days.get(day);
    if (
      !top ||
      set.weightKg > top.weightKg ||
      (set.weightKg === top.weightKg && set.repetitions > top.repetitions)
    )
      days.set(day, { weightKg: set.weightKg, repetitions: set.repetitions });
    byDay.set(set.exerciseId, days);
  }
  const history = new Map<string, ExerciseHistory>();
  for (const [exerciseId, days] of byDay) {
    const ordered = [...days.entries()].sort((a, b) =>
      b[0].localeCompare(a[0]),
    );
    const at = (i: number) =>
      ordered[i] ? { ...ordered[i]![1], date: ordered[i]![0] } : null;
    history.set(exerciseId, { last: at(0), previous: at(1) });
  }
  return history;
}

export type RecordEvent = {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  /** Cuánto más que la mejor marca anterior. */
  deltaKg: number;
  date: string;
};

/**
 * La marca personal más reciente: la última vez que una serie superó en peso
 * a todas las anteriores del mismo ejercicio.
 *
 * La primera vez que se hace un ejercicio no cuenta como marca: no supera
 * nada, sólo empieza la cuenta.
 */
export function latestRecord(sets: DatedSet[]): RecordEvent | null {
  const ordered = [...sets]
    .filter((s) => !s.isWarmup && s.weightKg !== null && s.repetitions !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const best = new Map<string, number>();
  let latest: RecordEvent | null = null;
  for (const set of ordered) {
    const previous = best.get(set.exerciseId);
    const weight = set.weightKg!;
    if (previous !== undefined && weight > previous)
      latest = {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName ?? "",
        weightKg: weight,
        deltaKg: Math.round((weight - previous) * 100) / 100,
        date: set.createdAt,
      };
    if (previous === undefined || weight > previous)
      best.set(set.exerciseId, weight);
  }
  return latest;
}

/** Segundos de trabajo que se suponen por serie al estimar la duración. */
export const SECONDS_PER_SET = 45;
/** Descanso que se supone cuando el plan no lo dice. */
export const DEFAULT_REST_SECONDS = 90;

/**
 * Minutos que se estima que dura una sesión: 45 s por serie, el descanso que
 * pide el plan entre series (90 s si no lo pide) y un minuto para cambiar de
 * ejercicio. No incluye el calentamiento. Es una estimación y la pantalla lo
 * dice.
 */
export function estimatedMinutes(
  exercises: { sets: number | null; restSeconds: number | null }[],
): number {
  const seconds = exercises.reduce((total, e) => {
    const sets = e.sets ?? 0;
    if (sets === 0) return total;
    const rest = e.restSeconds ?? DEFAULT_REST_SECONDS;
    return total + sets * SECONDS_PER_SET + (sets - 1) * rest + 60;
  }, 0);
  return Math.round(seconds / 60);
}
