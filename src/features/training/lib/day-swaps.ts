/**
 * Resolucion de sustituciones de ejercicio validas por un solo dia.
 *
 * Reglas que no se rompen:
 * - El plan NUNCA se modifica. La sustitucion vive en su propia tabla, con
 *   fecha, y se aplica al LEER. Por eso esta logica es una funcion pura:
 *   recibe el plan tal como esta guardado y devuelve como se ve hoy.
 * - Una sustitucion solo aplica a su fecha exacta. La de ayer no se arrastra.
 * - El original nunca se pierde de vista: viaja en `daySwap.original` para
 *   que la UI pueda decir "en lugar de X" y ofrecer deshacer.
 */

/** Forma minima que necesita un ejercicio del plan para poder sustituirse. */
export type SwappableExercise = {
  /** Id de la fila en workout_plan_exercises, no del catalogo. */
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  equipment: string | null;
};

/** Fila de exercise_day_swaps ya resuelta contra el catalogo. */
export type ExerciseDaySwapRecord = {
  planExerciseId: string;
  /** Fecha ISO `yyyy-mm-dd` a la que aplica. */
  date: string;
  substituteExerciseId: string;
  substituteName: string;
  substitutePrimaryMuscle: string;
  substituteEquipment: string | null;
  reason: string | null;
  source: "usuario" | "asistente";
};

/** Lo que se reemplazo, para poder mostrarlo y deshacerlo. */
export type DaySwapOrigin = {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  equipment: string | null;
  reason: string | null;
  source: "usuario" | "asistente";
};

export type WithDaySwap<T> = T & { daySwap: DaySwapOrigin | null };

/**
 * Aplica las sustituciones del dia sobre los ejercicios del plan.
 *
 * No muta la entrada ni el plan guardado: devuelve una vista nueva. Un
 * ejercicio sin sustitucion sale con `daySwap: null`, no se omite, para que
 * quien consuma esto no tenga que distinguir dos formas distintas.
 */
export function applyExerciseDaySwaps<T extends SwappableExercise>(
  exercises: readonly T[],
  swaps: readonly ExerciseDaySwapRecord[],
  date: string,
): WithDaySwap<T>[] {
  if (swaps.length === 0) {
    return exercises.map((exercise) => ({ ...exercise, daySwap: null }));
  }

  const byPlanExerciseId = new Map<string, ExerciseDaySwapRecord>();
  for (const swap of swaps) {
    // Solo la fecha pedida. Una sustitucion de ayer no aplica hoy.
    if (swap.date !== date) continue;
    byPlanExerciseId.set(swap.planExerciseId, swap);
  }

  return exercises.map((exercise) => {
    const swap = byPlanExerciseId.get(exercise.id);
    if (!swap) return { ...exercise, daySwap: null };

    // Sustituir por el mismo ejercicio no es una sustitucion. Se ignora en
    // vez de mostrar "en lugar de X, X", que solo confunde.
    if (swap.substituteExerciseId === exercise.exerciseId) {
      return { ...exercise, daySwap: null };
    }

    return {
      ...exercise,
      exerciseId: swap.substituteExerciseId,
      name: swap.substituteName,
      primaryMuscle: swap.substitutePrimaryMuscle,
      equipment: swap.substituteEquipment,
      daySwap: {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        equipment: exercise.equipment,
        reason: swap.reason,
        source: swap.source,
      },
    };
  });
}

/** true si ese ejercicio del plan tiene sustitucion vigente en esa fecha. */
export function hasSwapForDate(
  swaps: readonly ExerciseDaySwapRecord[],
  planExerciseId: string,
  date: string,
): boolean {
  return swaps.some(
    (swap) => swap.planExerciseId === planExerciseId && swap.date === date,
  );
}
