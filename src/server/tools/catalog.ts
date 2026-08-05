import { createClient } from "@/lib/supabase/server";
import {
  rankAlternatives,
  type EquivalenceFood,
} from "@/features/foods/lib/equivalence";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
import { rankComparisons } from "@/features/training/lib/exercise-comparison";
import {
  formatPrescription,
  recommendPrescription,
} from "@/features/training/lib/prescription";
import type { BiomechanicalExercise } from "@/features/training/lib/biomechanics";
import type { FoodGroup } from "@/features/foods/schemas";
import type {
  ExerciseAlternativeSuggestion,
  FoodAlternativeSuggestion,
  PrescriptionSuggestion,
} from "@/features/assistant/types";

/**
 * Busquedas de catalogo compartidas.
 *
 * Vivian privadas dentro de `features/assistant/actions.ts`, donde solo las
 * podia usar el camino deterministico. Al conectar el bucle de herramientas
 * hacian falta en los dos sitios, y duplicarlas habria sido la forma segura de
 * que el asistente y sus herramientas acabaran contestando cosas distintas.
 *
 * SERVER-ONLY.
 */

export const BIOMECHANICS_SELECT =
  "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, joints, resistance_profile, hardest_point, stability, range_of_motion, technical_demand, systemic_fatigue, progression_ease, is_unilateral, common_errors, technique_cues, image_url, image_end_url";

type CatalogRow = Record<string, unknown>;

export function toBiomechanical(row: CatalogRow): BiomechanicalExercise {
  return {
    id: String(row.id),
    name: String(row.name),
    primaryMuscle: String(row.primary_muscle),
    secondaryMuscles: (row.secondary_muscles as string[]) ?? [],
    movementPattern: (row.movement_pattern as string | null) ?? null,
    equipment: (row.equipment as string | null) ?? null,
    difficulty: (row.difficulty as string | null) ?? null,
    joints: (row.joints as string[]) ?? [],
    resistanceProfile:
      (row.resistance_profile as BiomechanicalExercise["resistanceProfile"]) ??
      null,
    hardestPoint: (row.hardest_point as string | null) ?? null,
    stability: (row.stability as number | null) ?? null,
    rangeOfMotion: (row.range_of_motion as number | null) ?? null,
    technicalDemand: (row.technical_demand as number | null) ?? null,
    systemicFatigue: (row.systemic_fatigue as number | null) ?? null,
    progressionEase: (row.progression_ease as number | null) ?? null,
    isUnilateral: Boolean(row.is_unilateral),
    commonErrors: (row.common_errors as string[]) ?? [],
    techniqueCues: (row.technique_cues as string[]) ?? [],
    imageUrl: (row.image_url as string | null) ?? null,
    imageEndUrl: (row.image_end_url as string | null) ?? null,
  };
}

/**
 * Busca un ejercicio del catalogo por un nombre hablado.
 *
 * Lo que el usuario escribe casi nunca coincide literal: "cuantas series
 * de sentadilla hago" deja "sentadilla hago". Se prueba la frase completa
 * y luego se van soltando palabras del final hasta encontrar coincidencia,
 * asi que "sentadilla hago" acaba resolviendo a "Sentadilla con barra".
 */
export async function findCatalogExercise(
  spokenName: string,
): Promise<BiomechanicalExercise | null> {
  const supabase = await createClient();
  const words = spokenName.trim().split(/\s+/).filter(Boolean);

  for (let length = words.length; length > 0; length -= 1) {
    const candidate = words.slice(0, length).join(" ");
    if (candidate.length < 3) continue;
    const { data } = await supabase
      .from("exercise_catalog")
      .select(BIOMECHANICS_SELECT)
      .ilike("name", `%${candidate}%`)
      .is("deleted_at", null)
      .limit(1);
    if (data?.[0]) return toBiomechanical(data[0]);
  }
  return null;
}

const FOOD_SELECT =
  "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g";

type FoodRow = {
  id: string;
  name: string;
  food_group: string;
  cooked_state: string | null;
  calories: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g: number;
};

export function toEquivalenceFood(food: FoodRow): EquivalenceFood {
  return {
    id: food.id,
    name: food.name,
    foodGroup: food.food_group as FoodGroup,
    cookedState: food.cooked_state as "crudo" | "cocido" | null,
    per100g: {
      calories: Number(food.calories),
      proteinG: Number(food.protein_g),
      carbohydrateG: Number(food.carbohydrate_g),
      fatG: Number(food.fat_g),
      fiberG: Number(food.fiber_g),
    },
  };
}

/** Alimentos de la biblioteca que coinciden con un nombre. */
export async function searchCatalogFoods(
  query: string,
  limit = 5,
): Promise<EquivalenceFood[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select(FOOD_SELECT)
    .ilike("name", `%${term}%`)
    .is("deleted_at", null)
    .limit(limit);

  return (data ?? []).map((row) => toEquivalenceFood(row as FoodRow));
}

/**
 * Un alimento a partir de una frase hablada, soltando palabras del final.
 *
 * Mismo problema que con los ejercicios: de "cambiar el arroz de mi almuerzo
 * por papa hoy" la deteccion extrae la frase entera, que no coincide con nada
 * del catalogo. Probando "arroz de mi almuerzo por papa hoy", luego "arroz de
 * mi almuerzo por papa"... se acaba llegando a "arroz".
 */
export async function findCatalogFoodByPhrase(
  phrase: string,
): Promise<EquivalenceFood | null> {
  const words = phrase.trim().split(/\s+/).filter(Boolean);

  for (let length = words.length; length > 0; length -= 1) {
    const candidate = words.slice(0, length).join(" ");
    if (candidate.length < 3) continue;
    const [match] = await searchCatalogFoods(candidate, 1);
    if (match) return match;
  }
  return null;
}

/** Un alimento concreto por su id. */
export async function getCatalogFood(
  foodId: string,
): Promise<EquivalenceFood | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select(FOOD_SELECT)
    .eq("id", foodId)
    .is("deleted_at", null)
    .maybeSingle();

  return data ? toEquivalenceFood(data as FoodRow) : null;
}

/** Busca el alimento mencionado y calcula alternativas reales del catalogo. */
export async function findFoodAlternatives(
  userId: string,
  foodName: string,
): Promise<FoodAlternativeSuggestion[]> {
  const supabase = await createClient();
  const source = await findCatalogFoodByPhrase(foodName);
  if (!source) return [];

  const [candidatesResult, preferencesResult, favoriteIds, recentIds] =
    await Promise.all([
      supabase.from("foods").select(FOOD_SELECT).is("deleted_at", null).limit(300),
      supabase
        .from("dietary_preferences")
        .select("value")
        .eq("user_id", userId)
        .in("preference_type", [
          "alergia",
          "restriccion",
          "alimento_no_deseado",
        ]),
      getFavoriteFoodIds(userId),
      getRecentFoodIds(userId),
    ]);

  return rankAlternatives({
    source,
    sourceQuantityG: 100,
    candidates: (candidatesResult.data ?? []).map((row) =>
      toEquivalenceFood(row as FoodRow),
    ),
    favoriteIds,
    recentIds: new Set(recentIds),
    restrictions: (preferencesResult.data ?? []).map((row) => row.value),
    maxResults: 2,
  }).map((candidate) => ({
    name: candidate.food.name,
    suggestedQuantityG: candidate.suggestedQuantityG,
    caloriesDiff: candidate.diff.calories,
  }));
}

/**
 * Alternativas de ejercicio usando el MISMO motor biomecanico que la
 * rutina, para que el asistente y la pantalla nunca se contradigan.
 */
export async function findExerciseAlternatives(
  exerciseName: string,
  maxResults = 3,
): Promise<ExerciseAlternativeSuggestion[]> {
  const supabase = await createClient();
  const source = await findCatalogExercise(exerciseName);
  if (!source) return [];

  const { data: candidates } = await supabase
    .from("exercise_catalog")
    .select(BIOMECHANICS_SELECT)
    .is("deleted_at", null)
    .limit(200);

  return rankComparisons(
    source,
    (candidates ?? []).map(toBiomechanical),
    maxResults,
  ).map((comparison) => ({
    name: comparison.exercise.name,
    compatibility: comparison.compatibility,
    recommendation: comparison.recommendation,
  }));
}

/** Esquema sugerido para un ejercicio, con el motor de prescripcion. */
export async function findPrescription(
  userId: string,
  exerciseName: string,
): Promise<PrescriptionSuggestion | null> {
  const supabase = await createClient();
  const [exercise, { data: profile }] = await Promise.all([
    findCatalogExercise(exerciseName),
    supabase
      .from("profiles")
      .select("primary_goal, experience_level")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  if (!exercise) return null;

  const prescription = recommendPrescription(exercise, {
    goal:
      profile?.primary_goal === "ganancia_muscular"
        ? "hipertrofia"
        : profile?.primary_goal === "perdida_grasa"
          ? "recomposicion"
          : "hipertrofia",
    experience:
      profile?.experience_level === "principiante" ||
      profile?.experience_level === "avanzado"
        ? profile.experience_level
        : "intermedio",
  });

  return {
    exerciseName: exercise.name,
    summary: formatPrescription(prescription),
    topReason: prescription.reasons[0] ?? "",
    progression: prescription.progression,
  };
}
