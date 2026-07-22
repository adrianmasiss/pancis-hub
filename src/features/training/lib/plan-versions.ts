/**
 * Versionado de rutinas (docs/02_PRODUCT_REQUIREMENTS.md 22).
 *
 * Mismo modelo que las dietas: una version es una FOTO COMPLETA e
 * inmutable, que guarda tambien el nombre del ejercicio del momento para
 * seguir siendo legible aunque el catalogo cambie.
 */

export type VersionPlanExercise = {
  exerciseId: string;
  /** Nombre en el momento de guardar. */
  exerciseName: string;
  position: number;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  rpe: number | null;
  tempo: string | null;
  restSeconds: number | null;
  notes: string | null;
};

export type VersionPlanDay = {
  name: string | null;
  dayIndex: number;
  exercises: VersionPlanExercise[];
};

export type PlanSnapshot = {
  name: string;
  objective: string | null;
  days: VersionPlanDay[];
};

export type PlanVersionSummary = {
  id: string;
  version: number;
  name: string;
  reason: string | null;
  createdAt: string;
  dayCount: number;
  exerciseCount: number;
  totalSets: number;
};

export function snapshotExerciseCount(snapshot: PlanSnapshot): number {
  return snapshot.days.reduce((total, day) => total + day.exercises.length, 0);
}

/** Series totales planificadas en toda la rutina. */
export function snapshotTotalSets(snapshot: PlanSnapshot): number {
  return snapshot.days.reduce(
    (total, day) =>
      total +
      day.exercises.reduce(
        (dayTotal, exercise) => dayTotal + (exercise.sets ?? 0),
        0,
      ),
    0,
  );
}

export type PlanVersionDifference = {
  addedDays: string[];
  removedDays: string[];
  addedExercises: { dayName: string; exerciseName: string }[];
  removedExercises: { dayName: string; exerciseName: string }[];
  /** Cambios de prescripcion sobre un ejercicio que sigue estando. */
  changedExercises: {
    dayName: string;
    exerciseName: string;
    field: string;
    from: string;
    to: string;
  }[];
  setsDelta: number;
};

function dayLabel(day: VersionPlanDay): string {
  return day.name || `Dia ${day.dayIndex}`;
}

const FIELD_LABELS = {
  sets: "series",
  repsMin: "reps minimas",
  repsMax: "reps maximas",
  rir: "RIR",
  restSeconds: "descanso",
} as const;

type ComparableField = keyof typeof FIELD_LABELS;

function formatValue(value: number | null): string {
  return value === null ? "—" : String(value);
}

/**
 * Que cambio entre dos versiones de la rutina. Los dias se identifican
 * por su indice, no por id: al restaurar se crean filas nuevas.
 */
export function diffPlanSnapshots(
  previous: PlanSnapshot,
  current: PlanSnapshot,
): PlanVersionDifference {
  const previousDays = new Map(previous.days.map((day) => [day.dayIndex, day]));
  const currentDays = new Map(current.days.map((day) => [day.dayIndex, day]));

  const addedDays: string[] = [];
  const removedDays: string[] = [];
  const addedExercises: PlanVersionDifference["addedExercises"] = [];
  const removedExercises: PlanVersionDifference["removedExercises"] = [];
  const changedExercises: PlanVersionDifference["changedExercises"] = [];

  for (const [index, day] of currentDays) {
    if (!previousDays.has(index)) addedDays.push(dayLabel(day));
  }
  for (const [index, day] of previousDays) {
    if (!currentDays.has(index)) removedDays.push(dayLabel(day));
  }

  for (const [index, currentDay] of currentDays) {
    const previousDay = previousDays.get(index);
    if (!previousDay) continue;

    const previousExercises = new Map(
      previousDay.exercises.map((exercise) => [exercise.exerciseId, exercise]),
    );
    const currentExercises = new Map(
      currentDay.exercises.map((exercise) => [exercise.exerciseId, exercise]),
    );

    for (const [id, exercise] of currentExercises) {
      const before = previousExercises.get(id);
      if (!before) {
        addedExercises.push({
          dayName: dayLabel(currentDay),
          exerciseName: exercise.exerciseName,
        });
        continue;
      }

      for (const field of Object.keys(FIELD_LABELS) as ComparableField[]) {
        if (before[field] !== exercise[field]) {
          changedExercises.push({
            dayName: dayLabel(currentDay),
            exerciseName: exercise.exerciseName,
            field: FIELD_LABELS[field],
            from: formatValue(before[field]),
            to: formatValue(exercise[field]),
          });
        }
      }
    }

    for (const [id, exercise] of previousExercises) {
      if (!currentExercises.has(id)) {
        removedExercises.push({
          dayName: dayLabel(previousDay),
          exerciseName: exercise.exerciseName,
        });
      }
    }
  }

  return {
    addedDays,
    removedDays,
    addedExercises,
    removedExercises,
    changedExercises,
    setsDelta: snapshotTotalSets(current) - snapshotTotalSets(previous),
  };
}

export function isIdenticalPlanSnapshot(
  previous: PlanSnapshot,
  current: PlanSnapshot,
): boolean {
  const diff = diffPlanSnapshots(previous, current);
  return (
    diff.addedDays.length === 0 &&
    diff.removedDays.length === 0 &&
    diff.addedExercises.length === 0 &&
    diff.removedExercises.length === 0 &&
    diff.changedExercises.length === 0 &&
    previous.name === current.name &&
    previous.objective === current.objective
  );
}
