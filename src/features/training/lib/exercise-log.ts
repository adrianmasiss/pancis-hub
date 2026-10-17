/**
 * La base de datos de pesos: cada ejercicio con todas sus series, por fecha.
 *
 * Se arma desde las sesiones (`getTrainingLog`) y no con otra consulta: así
 * la búsqueda filtra en el cliente, al instante, sin ir al servidor.
 */

export type LogSetInput = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  equipment: string | null;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
};

export type LogSessionInput = {
  id: string;
  startedAt: string;
  sets: LogSetInput[];
};

export type ExerciseLogEntry = {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  equipment: string | null;
  /** Un día por sesión, del más reciente al más antiguo. */
  days: {
    sessionId: string;
    date: string;
    sets: {
      weightKg: number | null;
      repetitions: number | null;
      isWarmup: boolean;
    }[];
  }[];
  /** Serie efectiva más pesada; a igual peso, la de más repeticiones. */
  best: { weightKg: number; repetitions: number; date: string } | null;
  effectiveSets: number;
};

export function buildExerciseLog(
  sessions: LogSessionInput[],
): ExerciseLogEntry[] {
  const byExercise = new Map<string, ExerciseLogEntry>();
  const ordered = [...sessions].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );
  for (const session of ordered) {
    const date = session.startedAt;
    for (const set of session.sets) {
      let entry = byExercise.get(set.exerciseId);
      if (!entry) {
        entry = {
          exerciseId: set.exerciseId,
          name: set.exerciseName,
          primaryMuscle: set.primaryMuscle,
          equipment: set.equipment,
          days: [],
          best: null,
          effectiveSets: 0,
        };
        byExercise.set(set.exerciseId, entry);
      }
      let day = entry.days.find((d) => d.sessionId === session.id);
      if (!day) {
        day = { sessionId: session.id, date, sets: [] };
        entry.days.push(day);
      }
      day.sets.push({
        weightKg: set.weightKg,
        repetitions: set.repetitions,
        isWarmup: set.isWarmup,
      });
      if (set.isWarmup) continue;
      entry.effectiveSets += 1;
      if (set.weightKg === null || set.repetitions === null) continue;
      const best = entry.best;
      if (
        !best ||
        set.weightKg > best.weightKg ||
        (set.weightKg === best.weightKg && set.repetitions > best.repetitions)
      )
        entry.best = {
          weightKg: set.weightKg,
          repetitions: set.repetitions,
          date,
        };
    }
  }
  // Lo último entrenado arriba: es lo que más se consulta.
  return [...byExercise.values()].sort((a, b) =>
    (b.days[0]?.date ?? "").localeCompare(a.days[0]?.date ?? ""),
  );
}

const plano = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Busca por nombre o músculo, sin importar tildes ni mayúsculas. */
export function searchExerciseLog(
  entries: ExerciseLogEntry[],
  query: string,
): ExerciseLogEntry[] {
  const q = plano(query);
  if (!q) return entries;
  return entries.filter(
    (e) => plano(e.name).includes(q) || plano(e.primaryMuscle).includes(q),
  );
}
