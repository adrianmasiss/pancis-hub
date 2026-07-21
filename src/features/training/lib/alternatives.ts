/**
 * Tipo compartido del catalogo de ejercicios.
 *
 * El ranking de sustituciones vivia aqui y fue reemplazado por
 * exercise-comparison.ts, que ademas de ordenar explica en que se parecen
 * dos ejercicios y que se gana o se pierde al cambiarlos.
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
