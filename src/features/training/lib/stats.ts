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
