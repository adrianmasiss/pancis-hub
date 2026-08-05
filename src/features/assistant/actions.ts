"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { getGeminiModel, hasGeminiApiKey } from "@/lib/ai/google";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { detectRelevantFormulas } from "@/features/assistant/lib/grounding";
import {
  getRecentMessages,
  saveConversationTurn,
} from "@/features/assistant/persistence";
import {
  formatSourcesForPrompt,
  getFormulaExplanation,
  getSourcesForFormula,
} from "@/server/tools/evidence";
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

const askSchema = z.object({
  message: z.string().trim().min(1).max(500),
  /** Conversacion a la que encadenar. Sin esto, se abre una nueva. */
  conversationId: z.uuid().optional(),
});

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
HABLALE A QUIEN PREGUNTA, de tu, en TODOS los campos incluido observation. Nunca hables de el en tercera persona ni lo nombres como si reportaras a otra persona: "El usuario indica que no tiene arroz" esta MAL, "No tienes arroz" esta bien. userContext.displayName es su nombre, no un sujeto del que informar.
Usa solo el contexto entregado por la app y no inventes datos del usuario.
No diagnostiques, no indiques medicamentos y no sustituyas profesionales de la salud.
No modifiques objetivos, planes, rutinas ni dietas; solo sugiere proximos pasos.
Si la pregunta requiere atencion clinica o sintomas preocupantes, recomienda consultar a un profesional.

Cuando el payload traiga foodAlternatives, exerciseAlternatives o prescription, esos valores YA fueron calculados por los motores deterministas de la app: usalos tal cual, cita sus numeros y no inventes cifras distintas ni recalcules por tu cuenta. Si prescription esta presente, tu respuesta debe incluir su esquema (series, repeticiones, RIR y descanso). Si userContext.routineTopFinding esta presente y la pregunta es sobre la rutina, apoyate en ese hallazgo.

Si userContext.activeDiet esta presente, es la dieta real que el usuario esta tratando de cumplir: usala como base concreta para responder preguntas sobre que comer, sustituciones dentro del plan, o si algo encaja con su dieta. Menciona comidas y alimentos tal como aparecen ahi, no inventes alimentos que no esten en el contexto.

EVIDENCIA. El payload trae "evidenciaDisponible": son las fuentes reales que sustentan las cifras del sistema, con su nivel de evidencia, la poblacion estudiada y sus limitaciones. Reglas que no se rompen:
- Cuando expliques de donde sale un numero del sistema, apoyate en esas fuentes y menciona la POBLACION si difiere del usuario (por ejemplo, si el estudio es en hombres jovenes y quien pregunta no lo es).
- Cada fuente trae su "Papel en esta cifra". RESPETALO: una fuente que "matiza" o "contradice" NO se presenta como apoyo, se presenta como el limite que es, y su "Nota del revisor" es lo que hay que contar de ella. Si una fuente aparece en la lista, o la usas con su papel correcto o no la mencionas.
- Si una fuente esta marcada como parametro de producto, NO la presentes como ciencia: es una decision de la app, di eso.
- Si no hay fuentes para el tema, dilo con naturalidad en vez de inventar una referencia. NUNCA cites un estudio, un PMID o un DOI que no aparezca en "evidenciaDisponible".
- Distingue siempre entre una cifra verificada del sistema y una estimacion general tuya.

CONTINUIDAD. "conversacionReciente" trae los ultimos mensajes. Usalos para no repetir lo ya dicho ni volver a pedir datos que el usuario ya dio.

Debes responder en el formato estructurado solicitado:
- observation: que ves en su situacion, dicho a el ("No tienes arroz", "Hoy vas 60 g de proteina").
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
  /** Fuentes ya resueltas. El modelo NO las busca ni las inventa. */
  evidence?: string;
  history?: { role: string; content: string }[];
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
        // Grounding: de donde salen las cifras del sistema, con su poblacion
        // y sus limitaciones. El modelo debe apoyarse en esto y decir cuando
        // una cifra NO viene de aqui.
        evidenciaDisponible: input.evidence || "Sin fuentes para este tema.",
        conversacionReciente: input.history ?? [],
      },
      null,
      2,
    ),
  });

  return object;
}

export async function askAssistant(
  input: unknown,
): Promise<
  { error: string } | { reply: AssistantReply; conversationId: string | null }
> {
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

  // Grounding: se resuelve ANTES de decidir si hay IA, porque las fuentes
  // acompanan a la respuesta tambien cuando contesta el motor deterministico.
  const formulaKeys = detectRelevantFormulas(parsed.data.message);
  const grounded = await Promise.all(
    formulaKeys.map((key) => getSourcesForFormula(key)),
  );
  const sources = grounded.flatMap((entry) => entry.sources);
  const replySources = sources.map((source) => ({
    title: source.title,
    identifier: source.identifier,
    evidenceGrade: source.evidenceGrade,
    population: source.population,
    // El papel y su nota se muestran al usuario: leer "nivel de evidencia A"
    // debajo de una cifra sin saber que ese estudio la matiza es peor que no
    // citarlo.
    role: source.role,
    note: source.note,
    isProductParameter: source.isProductParameter,
  }));

  const history = parsed.data.conversationId
    ? await getRecentMessages(user.id, parsed.data.conversationId)
    : [];

  const persist = (reply: AssistantReply, provider: "reglas" | "gemini") =>
    saveConversationTurn({
      userId: user.id,
      conversationId: parsed.data.conversationId,
      question: parsed.data.message,
      answer: [reply.observation, reply.interpretation, reply.action]
        .filter(Boolean)
        .join("\n\n"),
      provider,
      sources,
    });

  /*
   * "Por que ese numero" NO pasa por el modelo, ni cuando hay clave.
   *
   * El valor, su justificacion y sus limitaciones se redactaron y se revisaron
   * al aprobar el claim en `formula_versions`. Pasarlos por un modelo solo
   * puede degradarlos: reescribe un texto ya aprobado, elige de que fuentes
   * habla y cambia la persona ("el usuario Demo Pancis pregunta..." en vez de
   * hablarle a quien pregunta). Esto ya estaba escrito como intencion en
   * `buildAskPayload`, pero el codigo no lo hacia: la respuesta deterministica
   * se calculaba y se descartaba en cuanto habia clave.
   *
   * Si la constante no tiene explicacion registrada, si baja al modelo: ahi no
   * hay texto aprobado que proteger y la pregunta queda abierta.
   */
  const explainedFromRegistry =
    intent.kind === "whyThisNumber" && context.formulaExplanation != null;

  // RF-015: sin IA generativa el asistente sigue respondiendo, y ahora ademas
  // con sus fuentes.
  if (explainedFromRegistry || !hasGeminiApiKey()) {
    const reply = { ...fallbackReply, sources: replySources };
    const { conversationId } = await persist(reply, "reglas");
    return { reply, conversationId };
  }

  try {
    const generated = await generateGeminiReply({
      message: parsed.data.message,
      context,
      intent,
      foodAlternatives,
      exerciseAlternatives,
      prescription,
      evidence: formatSourcesForPrompt(sources),
      history: history.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
    });
    // Las fuentes las pone el servidor, NO el modelo: asi no puede citar algo
    // que no se le dio.
    const reply = { ...generated, sources: replySources };
    const { conversationId } = await persist(reply, "gemini");
    return { reply, conversationId };
  } catch (error) {
    console.error("Gemini assistant error:", error);
  }

  const reply = { ...fallbackReply, sources: replySources };
  const { conversationId } = await persist(reply, "reglas");
  return { reply, conversationId };
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
  "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, joints, resistance_profile, hardest_point, stability, range_of_motion, technical_demand, systemic_fatigue, progression_ease, is_unilateral, common_errors, technique_cues, image_url, image_end_url";

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
    imageUrl: (row.image_url as string | null) ?? null,
    imageEndUrl: (row.image_end_url as string | null) ?? null,
  };
}

async function buildAskPayload(userId: string, message: string) {
  const intent = detectIntent(message);
  const baseContext = await buildContext(userId);

  // "Por que ese numero" se responde SIN IA: el valor y su justificacion ya
  // estan revisados en formula_versions.
  const context: AssistantContext =
    intent.kind === "whyThisNumber"
      ? {
          ...baseContext,
          formulaExplanation: await getFormulaExplanation(
            intent.formulaKey,
            // Su objetivo recorta las tablas por objetivo a la fila que le toca.
            baseContext.primaryGoal,
          ),
        }
      : baseContext;
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
