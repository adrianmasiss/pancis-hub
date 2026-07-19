/**
 * Sustitucion de ejercicios: alternativas ordenadas por similitud
 * funcional. Dos ejercicios NUNCA se presentan como identicos; el
 * puntaje solo ordena opciones razonables.
 *
 * score = 0 base
 *       + 100 si el musculo principal difiere
 *       + 30  si el patron de movimiento difiere
 *       + 10  si la dificultad difiere
 *       - 8 por cada musculo secundario compartido (maximo 2)
 * Menor score = mas similar.
 */

export type CatalogExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string | null;
  equipment: string | null;
  difficulty: string | null;
};

export type ExerciseAlternative = {
  exercise: CatalogExercise;
  samePrimaryMuscle: boolean;
  samePattern: boolean;
  score: number;
};

export function rankExerciseAlternatives(
  source: CatalogExercise,
  candidates: CatalogExercise[],
  options?: { equipment?: string | null; maxResults?: number },
): ExerciseAlternative[] {
  const maxResults = options?.maxResults ?? 8;
  const requiredEquipment = options?.equipment;

  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .filter(
      (candidate) =>
        !requiredEquipment || candidate.equipment === requiredEquipment,
    )
    .map((candidate) => {
      const samePrimaryMuscle =
        candidate.primaryMuscle === source.primaryMuscle;
      const samePattern =
        source.movementPattern !== null &&
        candidate.movementPattern === source.movementPattern;
      const sharedSecondary = candidate.secondaryMuscles.filter((muscle) =>
        source.secondaryMuscles.includes(muscle),
      ).length;

      const score =
        (samePrimaryMuscle ? 0 : 100) +
        (samePattern ? 0 : 30) +
        (candidate.difficulty === source.difficulty ? 0 : 10) -
        Math.min(sharedSecondary, 2) * 8;

      return { exercise: candidate, samePrimaryMuscle, samePattern, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);
}
