"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { getGeminiModel, hasGeminiApiKey } from "@/lib/ai/google";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { windowDifference, trendDirection } from "@/lib/trends";
import {
  rankAlternatives,
  type EquivalenceFood,
} from "@/features/foods/lib/equivalence";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
import { getRoutineAnalysis } from "@/features/training/queries";
import { rankComparisons } from "@/features/training/lib/exercise-comparison";
import {
  formatPrescription,
  recommendPrescription,
} from "@/features/training/lib/prescription";
import type { BiomechanicalExercise } from "@/features/training/lib/biomechanics";
import type { FoodGroup } from "@/features/foods/schemas";
import {
  detectIntent,
  deterministicProvider,
} from "@/features/assistant/lib/rules";
import type {
  AssistantContext,
  AssistantReply,
  ExerciseAlternativeSuggestion,
  FoodAlternativeSuggestion,
  PrescriptionSuggestion,
} from "@/features/assistant/types";

const askSchema = z.object({ message: z.string().trim().min(1).max(500) });

const assistantReplySchema = z.object({
  observation: z.string().min(1),
  interpretation: z.string().min(1),
  confidence: z.enum(["baja", "media", "alta"]),
  action: z.string().min(1),
  alternative: z.string().min(1).optional(),
  reason: z.string().min(1),
  reevaluate: z.string().min(1),
});

const GEMINI_ASSISTANT_SYSTEM_PROMPT = `Eres el asistente contextual de Pancis Hub, una app de nutricion, entrenamiento y progreso.

Responde en espanol latinoamericano, con tono claro, prudente y accionable.
Usa solo el contexto entregado por la app y no inventes datos del usuario.
No diagnostiques, no indiques medicamentos y no sustituyas profesionales de la salud.
No modifiques objetivos, planes, rutinas ni dietas; solo sugiere proximos pasos.
Si la pregunta requiere atencion clinica o sintomas preocupantes, recomienda consultar a un profesional.

Cuando el payload traiga foodAlternatives, exerciseAlternatives o prescription, esos valores YA fueron calculados por los motores deterministas de la app: usalos tal cual, cita sus numeros y no inventes cifras distintas ni recalcules por tu cuenta. Si prescription esta presente, tu respuesta debe incluir su esquema (series, repeticiones, RIR y descanso). Si userContext.routineTopFinding esta presente y la pregunta es sobre la rutina, apoyate en ese hallazgo.

Si userContext.activeDiet esta presente, es la dieta real que el usuario esta tratando de cumplir: usala como base concreta para responder preguntas sobre que comer, sustituciones dentro del plan, o si algo encaja con su dieta. Menciona comidas y alimentos tal como aparecen ahi, no inventes alimentos que no esten en el contexto.

Debes responder en el formato estructurado solicitado:
- observation: que observas del mensaje/contexto.
- interpretation: que significa de forma prudente.
- confidence: baja, media o alta.
- action: una accion concreta y reversible.
- alternative: una opcion alternativa si aplica.
- reason: por que esa accion tiene sentido.
- reevaluate: cuando revisar de nuevo.`;

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function buildContext(userId: string): Promise<AssistantContext> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, primary_goal, timezone")
    .eq("id", userId)
    .single();
  const today = todayInTimezone(profile?.timezone ?? "UTC");
  const since60 = new Date(Date.now() - 60 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [
    targetsResult,
    mealsResult,
    weightsResult,
    checkinResult,
    planResult,
    dietResult,
  ] = await Promise.all([
      supabase
        .from("nutrition_targets")
        .select("calories, protein_g, carbohydrate_g, fat_g")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("meals")
        .select(
          "status, meal_items(calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot)",
        )
        .eq("user_id", userId)
        .eq("date", today)
        .is("deleted_at", null),
      supabase
        .from("body_measurements")
        .select("measured_at, weight_kg")
        .eq("user_id", userId)
        .gte("measured_at", since60)
        .not("weight_kg", "is", null)
        .order("measured_at"),
      supabase
        .from("daily_checkins")
        .select("sleep_hours")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("workout_plans")
        .select("id, name")
        .eq("user_id", userId)
        .eq("active", true)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("diet_templates")
        .select(
          "name, diet_template_meals(name, meal_type, order_index, diet_template_items(quantity_g, foods(name)))",
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

  const consumed = { calories: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };
  let pendingMeals = 0;
  for (const meal of mealsResult.data ?? []) {
    if (meal.status === "omitida") continue;
    if (meal.status === "planificada") {
      pendingMeals += 1;
      continue;
    }
    for (const item of meal.meal_items ?? []) {
      consumed.calories += Number(item.calories_snapshot);
      consumed.proteinG += Number(item.protein_snapshot);
      consumed.carbohydrateG += Number(item.carbohydrate_snapshot);
      consumed.fatG += Number(item.fat_snapshot);
    }
  }

  // Analisis de la rutina activa, si existe.
  const routineAnalysis = planResult.data?.id
    ? await getRoutineAnalysis(userId, planResult.data.id)
    : null;

  const series = (weightsResult.data ?? []).map((row) => ({
    date: row.measured_at,
    value: Number(row.weight_kg),
  }));
  const weeklyChange = windowDifference(series, 7);

  return {
    displayName: profile?.display_name ?? "",
    primaryGoal: profile?.primary_goal ?? null,
    targets: targetsResult.data
      ? {
          calories: targetsResult.data.calories,
          proteinG: Number(targetsResult.data.protein_g),
          carbohydrateG: Number(targetsResult.data.carbohydrate_g),
          fatG: Number(targetsResult.data.fat_g),
        }
      : null,
    consumedToday: consumed,
    weightWeeklyChange: weeklyChange,
    weightTrend: trendDirection(weeklyChange),
    sleepHoursToday:
      checkinResult.data?.sleep_hours !== null && checkinResult.data !== null
        ? Number(checkinResult.data.sleep_hours)
        : null,
    activePlanName: planResult.data?.name ?? null,
    pendingMeals,
    // El asistente habla de la rutina con el mismo analisis que ve el
    // usuario en la pagina, no con una heuristica propia.
    routineTopFinding: routineAnalysis?.findings[0]
      ? {
          priority: routineAnalysis.findings[0].priority,
          title: routineAnalysis.findings[0].title,
          detail: routineAnalysis.findings[0].detail,
        }
      : null,
    weeklySetsByMuscle: routineAnalysis?.weeklySetsByMuscle ?? [],
    activeDiet: dietResult.data
      ? {
          name: dietResult.data.name,
          meals: [...dietResult.data.diet_template_meals]
            .sort((a, b) => a.order_index - b.order_index)
            .map((meal) => ({
              name: meal.name || meal.meal_type,
              items: meal.diet_template_items.map((item) => ({
                foodName: item.foods?.name ?? "",
                quantityG: Number(item.quantity_g),
              })),
            })),
        }
      : null,
  };
}

/** Busca el alimento mencionado y calcula alternativas reales del catalogo. */
async function findFoodAlternatives(
  userId: string,
  foodName: string,
): Promise<FoodAlternativeSuggestion[]> {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("foods")
    .select(
      "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
    )
    .ilike("name", `%${foodName}%`)
    .is("deleted_at", null)
    .limit(1);
  const source = matches?.[0];
  if (!source) return [];

  const [candidatesResult, preferencesResult, favoriteIds, recentIds] =
    await Promise.all([
      supabase
        .from("foods")
        .select(
          "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
        )
        .is("deleted_at", null)
        .limit(300),
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

  const toEquivalence = (food: typeof source): EquivalenceFood => ({
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
  });

  return rankAlternatives({
    source: toEquivalence(source),
    sourceQuantityG: 100,
    candidates: (candidatesResult.data ?? []).map(toEquivalence),
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

async function generateGeminiReply(input: {
  message: string;
  context: AssistantContext;
  intent: ReturnType<typeof detectIntent>;
  foodAlternatives?: FoodAlternativeSuggestion[];
  exerciseAlternatives?: ExerciseAlternativeSuggestion[];
  prescription?: PrescriptionSuggestion | null;
}): Promise<AssistantReply> {
  const { object } = await generateObject({
    model: getGeminiModel(),
    schema: assistantReplySchema,
    schemaName: "assistant_reply",
    schemaDescription:
      "Respuesta estructurada del asistente contextual de Pancis Hub.",
    system: GEMINI_ASSISTANT_SYSTEM_PROMPT,
    prompt: JSON.stringify(
      {
        userMessage: input.message,
        detectedIntent: input.intent,
        userContext: input.context,
        foodAlternatives: input.foodAlternatives ?? [],
        // Resultados ya calculados por los motores deterministas: el
        // modelo debe usarlos tal cual, no recalcularlos por su cuenta.
        exerciseAlternatives: input.exerciseAlternatives ?? [],
        prescription: input.prescription ?? null,
      },
      null,
      2,
    ),
  });

  return object;
}

export async function askAssistant(
  input: unknown,
): Promise<{ error: string } | { reply: AssistantReply }> {
  const parsed = askSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) {
    return { error: messages.assistant.actionFailed };
  }

  const {
    intent,
    context,
    foodAlternatives,
    exerciseAlternatives,
    prescription,
    fallbackReply,
  } = await buildAskPayload(user.id, parsed.data.message);

  if (!hasGeminiApiKey()) {
    return { reply: fallbackReply };
  }

  try {
    const reply = await generateGeminiReply({
      message: parsed.data.message,
      context,
      intent,
      foodAlternatives,
      exerciseAlternatives,
      prescription,
    });
    return { reply };
  } catch (error) {
    console.error("Gemini assistant error:", error);
  }

  return { reply: fallbackReply };
}

/**
 * Alternativas de ejercicio usando el MISMO motor biomecanico que la
 * rutina, para que el asistente y la pantalla nunca se contradigan.
 */
async function findExerciseAlternatives(
  exerciseName: string,
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
    3,
  ).map((comparison) => ({
    name: comparison.exercise.name,
    compatibility: comparison.compatibility,
    recommendation: comparison.recommendation,
  }));
}

/** Esquema sugerido para un ejercicio, con el motor de prescripcion. */
async function findPrescription(
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

const BIOMECHANICS_SELECT =
  "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, joints, resistance_profile, hardest_point, stability, range_of_motion, technical_demand, systemic_fatigue, progression_ease, is_unilateral, common_errors, technique_cues";

type CatalogRow = Record<string, unknown>;

function toBiomechanical(row: CatalogRow): BiomechanicalExercise {
  return {
    id: String(row.id),
    name: String(row.name),
    primaryMuscle: String(row.primary_muscle),
    secondaryMuscles: (row.secondary_muscles as string[]) ?? [],
    movementPattern: (row.movement_pattern as string | null) ?? null,
    equipment: (row.equipment as string | null) ?? null,
    difficulty: (row.difficulty as string | null) ?? null,
    joints: (row.joints as string[]) ?? [],
    resistanceProfile: (row.resistance_profile as BiomechanicalExercise["resistanceProfile"]) ?? null,
    hardestPoint: (row.hardest_point as string | null) ?? null,
    stability: (row.stability as number | null) ?? null,
    rangeOfMotion: (row.range_of_motion as number | null) ?? null,
    technicalDemand: (row.technical_demand as number | null) ?? null,
    systemicFatigue: (row.systemic_fatigue as number | null) ?? null,
    progressionEase: (row.progression_ease as number | null) ?? null,
    isUnilateral: Boolean(row.is_unilateral),
    commonErrors: (row.common_errors as string[]) ?? [],
    techniqueCues: (row.technique_cues as string[]) ?? [],
  };
}

async function buildAskPayload(userId: string, message: string) {
  const intent = detectIntent(message);
  const context = await buildContext(userId);
  const [foodAlternatives, exerciseAlternatives, prescription] =
    await Promise.all([
      intent.kind === "foodMissing"
        ? findFoodAlternatives(userId, intent.foodName)
        : Promise.resolve(undefined),
      intent.kind === "exerciseSubstitute"
        ? findExerciseAlternatives(intent.exerciseName)
        : Promise.resolve(undefined),
      intent.kind === "setsAndReps"
        ? findPrescription(userId, intent.exerciseName)
        : Promise.resolve(null),
    ]);

  const fallbackReply = deterministicProvider.generateReply({
    context,
    intent,
    foodAlternatives,
    exerciseAlternatives,
    prescription,
  });

  return {
    intent,
    context,
    foodAlternatives,
    exerciseAlternatives,
    prescription,
    fallbackReply,
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
async function findCatalogExercise(
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
