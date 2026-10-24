"use server";

import { generateObject, generateText, hasToolCall, stepCountIs } from "ai";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getGeminiModel, hasGeminiApiKey } from "@/lib/ai/google";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { detectRelevantFormulas } from "@/features/assistant/lib/grounding";
import {
  deleteAllConversations,
  getRecentMessages,
  saveConversationTurn,
} from "@/features/assistant/persistence";
import {
  formatSourcesForPrompt,
  getFormulaExplanation,
  getSourcesForFormula,
} from "@/server/tools/evidence";
import { windowDifference, trendDirection } from "@/lib/trends";
import { todayInTimezone } from "@/lib/dates";
import { getRoutineAnalysis } from "@/features/training/queries";
import {
  findCatalogExercise,
  findCatalogFoodByPhrase,
  findExerciseAlternatives,
  findFoodAlternatives,
  findPrescription,
} from "@/server/tools/catalog";
import { buildAssistantToolset } from "@/server/tools/toolset";
import type { ToolSource } from "@/server/tools/types";
import {
  detectIntent,
  deterministicProvider,
} from "@/features/assistant/lib/rules";
import type {
  AssistantOption,
  AssistantContext,
  AssistantReply,
  ExerciseAlternativeSuggestion,
  FoodAlternativeSuggestion,
  PrescriptionSuggestion,
} from "@/features/assistant/types";

/** Foto adjunta (vista movil): data URL de imagen, ya reducida en el cliente. */
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const askSchema = z.object({
  message: z.string().trim().min(1).max(500),
  /** Conversacion a la que encadenar. Sin esto, se abre una nueva. */
  conversationId: z.uuid().optional(),
  image: z.string().max(6_000_000).regex(IMAGE_DATA_URL).optional(),
});

const assistantReplySchema = z.object({
  observation: z.string().min(1),
  interpretation: z.string().min(1),
  confidence: z.enum(["baja", "media", "alta"]),
  action: z.string().min(1),
  alternative: z.string().min(1).optional(),
  reason: z.string().min(1),
  reevaluate: z.string().min(1),
  /*
   * Opciones concretas para «Usar» (agregarlas a hoy). El modelo solo da ids
   * de la biblioteca y gramos; los macros los calcula el servidor.
   */
  options: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        items: z
          .array(
            z.object({
              foodId: z.string().describe("id devuelto por search_foods"),
              grams: z.number().positive().max(2000),
            }),
          )
          .min(1)
          .max(6),
      }),
    )
    .max(3)
    .optional(),
  /*
   * Las fuentes que de verdad respaldan la respuesta, por su titulo exacto.
   * Solo se muestran esas: listar todo lo que trajo el grounding ponia un
   * estudio de testosterona debajo de una pregunta sobre ayuno.
   */
  citedSources: z
    .array(z.string().min(1))
    .max(6)
    .optional()
    .describe(
      "Titulos EXACTOS de las fuentes de evidenciaDisponible o de las herramientas que respaldan lo que dices. Vacio si ninguna trata el tema.",
    ),
});

type GeneratedReply = z.infer<typeof assistantReplySchema>;

/**
 * Las opciones del modelo, resueltas contra el catalogo: nombre real y macros
 * calculados aqui (invariante 3 del toolset: el modelo nunca dicta macros).
 * Un id que no existe o no es visible para el usuario se descarta.
 */
async function resolveOptions(
  raw: GeneratedReply["options"],
): Promise<AssistantOption[] | undefined> {
  if (!raw?.length) return undefined;
  const ids = [
    ...new Set(raw.flatMap((o) => o.items.map((i) => i.foodId))),
  ].filter((id) => z.uuid().safeParse(id).success);
  if (ids.length === 0) return undefined;
  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select("id, name, calories, protein_g, carbohydrate_g, fat_g")
    .in("id", ids)
    .is("deleted_at", null);
  const foods = new Map((data ?? []).map((f) => [f.id, f]));
  const options = raw
    .map((option) => {
      const items = option.items.flatMap((item) => {
        const food = foods.get(item.foodId);
        return food ? [{ food, grams: Math.round(item.grams) }] : [];
      });
      if (items.length === 0) return null;
      const sum = (
        key: "calories" | "protein_g" | "carbohydrate_g" | "fat_g",
      ) =>
        Math.round(
          items.reduce((t, i) => t + (Number(i.food[key]) * i.grams) / 100, 0),
        );
      return {
        title: option.title,
        items: items.map((i) => ({
          foodId: i.food.id,
          name: i.food.name,
          grams: i.grams,
        })),
        calories: sum("calories"),
        proteinG: sum("protein_g"),
        carbohydrateG: sum("carbohydrate_g"),
        fatG: sum("fat_g"),
      };
    })
    .filter((o): o is AssistantOption => o !== null);
  return options.length ? options : undefined;
}

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
- NUNCA cites un estudio, un PMID o un DOI que no aparezca en "evidenciaDisponible" o en lo que devuelvan las herramientas.

SOLO EVIDENCIA (regla del producto, no se rompe). Toda afirmacion de salud, nutricion o entrenamiento (que funciona, cuanto conviene, que es mejor, que efecto tiene) sale UNICAMENTE de "evidenciaDisponible" o de lo que devuelvan search_evidence y get_claim_sources. Nada de conocimiento general tuyo.
- Si la pregunta es de ese tipo y el payload no trae fuentes que traten el tema, llama a search_evidence antes de responder.
- Si tampoco hay, dilo claro en observation: "La biblioteca de evidencia de Pancis no tiene estudios sobre <tema>". No respondas igual con lo que sabes; limita la accion a lo que si sale de sus datos (su plan, sus cifras, su registro) o a consultarlo con un profesional, y pon confianza baja.
- Los datos del propio usuario (su plan, lo que comio, sus medidas) y las cifras que calcula la app si se pueden usar: son hechos, no afirmaciones cientificas.
- En "citedSources" pon el titulo exacto de cada fuente que respalda lo que dices. Una fuente del payload que no trata la pregunta NO se cita.

HERRAMIENTAS. Tienes herramientas para consultar el catalogo, los motores de la app y la biblioteca cientifica. Usalas en vez de suponer:
- Si te falta un dato concreto (un alimento, un ejercicio, una medida, una fuente), llamala. Es preferible una llamada mas a una respuesta vaga o inventada.
- Nunca dictes macros ni compatibilidades tu: pide ids con search_foods y deja que compare_foods calcule.
- Las herramientas que empiezan por "propose_" NO aplican nada. Devuelven una propuesta que el usuario tiene que confirmar en pantalla; dilo asi en tu respuesta.
- Si con lo que ya traes en el payload puedes responder, no llames a nada mas: cada llamada cuesta cuota.
- TU RESPUESTA SE ENTREGA LLAMANDO A LA HERRAMIENTA "responder", SIEMPRE. No escribas la respuesta como texto suelto: si lo haces, el usuario no la ve.

CONTINUIDAD. "conversacionReciente" trae los ultimos mensajes. Usalos para no repetir lo ya dicho ni volver a pedir datos que el usuario ya dio.

Debes responder en el formato estructurado solicitado:
- observation: que ves en su situacion, dicho a el ("No tienes arroz", "Hoy vas 60 g de proteina").
- interpretation: que significa de forma prudente.
- confidence: baja, media o alta.
- action: una accion concreta y reversible.
- alternative: una opcion alternativa si aplica.
- reason: por que esa accion tiene sentido.
- reevaluate: cuando revisar de nuevo.
- citedSources: los titulos exactos de las fuentes que respaldan la respuesta (ver SOLO EVIDENCIA).
- options (opcional): si la pregunta es QUE COMER (o hay una foto de comida), 1 a 3 opciones concretas que el usuario pueda agregar a su dia con un toque. Cada opcion: un titulo corto y sus alimentos con el id de search_foods y los gramos. NO escribas calorias ni macros: la app los calcula desde el catalogo. Si no encuentras los alimentos en la biblioteca, no inventes ids: omite options.

FOTO. Si llega una imagen, describe lo que ves en el plato y estima porciones con prudencia (di que es una estimacion). Busca esos alimentos con search_foods y propon UNA opcion en "options" con lo que se ve, para que el usuario la registre si quiere.`;

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
    today,
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

/**
 * Tope de pasos del bucle de herramientas.
 *
 * Cada paso es OTRA llamada a Gemini, y la cuota del plan gratuito es el cuello
 * de botella real del proyecto. Cuatro da margen para buscar un alimento,
 * compararlo y responder, sin que una pregunta rara se coma la cuota del dia.
 */
const MAX_TOOL_STEPS = 4;

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
  /** Herramientas que el modelo puede llamar por su cuenta. */
  tools: ReturnType<typeof buildAssistantToolset>;
  /** Foto adjunta, como data URL. */
  image?: string;
}): Promise<{ reply: GeneratedReply | null; toolNames: string[] }> {
  const payload = JSON.stringify(
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
  );
  const { steps, text } = await generateText({
    model: getGeminiModel(),
    tools: input.tools,
    // Termina cuando entrega la respuesta, o cuando se acaba el presupuesto.
    stopWhen: [hasToolCall("responder"), stepCountIs(MAX_TOOL_STEPS)],
    system: GEMINI_ASSISTANT_SYSTEM_PROMPT,
    // Con foto, el mensaje lleva la imagen al lado del contexto.
    ...(input.image
      ? {
          messages: [
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: payload },
                {
                  type: "file" as const,
                  data: input.image,
                  mediaType: "image/jpeg",
                },
              ],
            },
          ],
        }
      : { prompt: payload }),
  });

  const calls = steps.flatMap((step) => step.toolCalls);
  const toolNames = calls.map((call) => call.toolName);
  const answer = calls.find((call) => call.toolName === "responder");
  const parsed = answer
    ? assistantReplySchema.safeParse(answer.input)
    : { success: false as const };

  if (parsed.success) return { reply: parsed.data, toolNames };

  /*
   * A veces contesta en texto plano en vez de llamar a `responder`, sobre todo
   * despues de usar una herramienta. Esa respuesta suele ser buena, y tirarla
   * para caer al motor de reglas seria desperdiciar el trabajo (y la cuota) que
   * ya se gasto. Se le da forma en una segunda llamada SIN herramientas, que es
   * la unica forma de usar salida estructurada con Gemini.
   */
  if (text.trim().length > 0) {
    const { object } = await generateObject({
      model: getGeminiModel(),
      schema: assistantReplySchema,
      system: GEMINI_ASSISTANT_SYSTEM_PROMPT,
      prompt: `Esta es tu respuesta en texto libre. Pasala al formato estructurado sin anadir datos nuevos ni cifras que no esten aqui:\n\n${text}`,
    });
    return { reply: object, toolNames: [...toolNames, "(reformateo)"] };
  }

  // Ni herramienta ni texto: contesta el motor deterministico.
  return { reply: null, toolNames };
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
  /*
   * Las fuentes se acumulan de dos sitios: el grounding por palabras clave y
   * lo que devuelvan las herramientas que llame el modelo. Las dos las resuelve
   * el servidor, asi que el modelo sigue sin poder citar un estudio que nadie
   * le dio.
   */
  const sources = grounded.flatMap((entry) => entry.sources);
  const collectSources = (extra: ToolSource[]) => sources.push(...extra);

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
    const reply = { ...fallbackReply, sources: toReplySources(sources) };
    const { conversationId } = await persist(reply, "reglas");
    return { reply, conversationId };
  }

  try {
    const { reply: generated, toolNames } = await generateGeminiReply({
      image: parsed.data.image,
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
      tools: buildAssistantToolset({
        userId: user.id,
        today: context.today,
        onSources: collectSources,
        replySchema: assistantReplySchema,
      }),
    });
    if (toolNames.length > 0) {
      console.info("Copiloto, herramientas usadas:", toolNames.join(", "));
    }
    // Las fuentes las pone el servidor, NO el modelo: asi no puede citar algo
    // que no se le dio. Aqui ya incluyen lo que trajeron las herramientas.
    const reply: AssistantReply = generated
      ? {
          ...withoutCited(generated),
          options: await resolveOptions(generated.options),
          sources: toReplySources(citedOnly(sources, generated.citedSources)),
        }
      : { ...fallbackReply, sources: toReplySources(sources) };
    const { conversationId } = await persist(
      reply,
      generated ? "gemini" : "reglas",
    );
    return { reply, conversationId };
  } catch (error) {
    console.error("Gemini assistant error:", error);
    /*
     * Aqui se sabe algo que el motor deterministico no puede saber: que la IA
     * estaba configurada y fallo, casi siempre por cuota. Decirlo evita que el
     * usuario crea que la app "es asi de simple" cuando en realidad esta
     * degradada, y le dice que reintentar tiene sentido.
     */
    const reply = {
      ...fallbackReply,
      reason: messages.assistant.aiUnavailable,
      sources: toReplySources(sources),
    };
    const { conversationId } = await persist(reply, "reglas");
    return { reply, conversationId };
  }

  const reply = { ...fallbackReply, sources: toReplySources(sources) };
  const { conversationId } = await persist(reply, "reglas");
  return { reply, conversationId };
}

const plainTitle = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Solo las fuentes que el modelo dice usar, y solo si se le dieron: un titulo
 * que no esta en la lista se ignora, asi que no puede colar una cita.
 */
function citedOnly(sources: ToolSource[], cited?: string[]): ToolSource[] {
  if (!cited?.length) return [];
  const wanted = cited.map(plainTitle).filter((t) => t.length > 8);
  return sources.filter((source) => {
    const title = plainTitle(source.title);
    return wanted.some((w) => title.includes(w) || w.includes(title));
  });
}

function withoutCited(reply: GeneratedReply) {
  const { citedSources: _cited, ...rest } = reply;
  void _cited;
  return rest;
}

/**
 * Fuentes listas para la interfaz, sin repetidas.
 *
 * Hace falta deduplicar porque ahora llegan de dos sitios: el grounding por
 * palabras clave y las herramientas. Preguntar por la proteina y ademas llamar
 * a `get_claim_sources` traeria a Morton dos veces.
 */
function toReplySources(
  sources: ToolSource[],
): NonNullable<AssistantReply["sources"]> {
  const seen = new Set<string>();
  const unique: ToolSource[] = [];

  for (const source of sources) {
    const key = source.identifier ?? source.title;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(source);
  }

  return unique.map((source) => ({
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
}

async function buildAskPayload(userId: string, message: string) {
  let intent = detectIntent(message);
  const baseContext = await buildContext(userId);

  /*
   * Desambiguacion contra el catalogo real.
   *
   * "cambiar el arroz de mi almuerzo por papa" cae en exerciseSubstitute,
   * porque la regla se dispara con el verbo "cambiar" y no sabe de que se
   * habla. El resultado era el peor posible: el asistente contestaba "no
   * encontre ese EJERCICIO" a una pregunta sobre comida.
   *
   * Ninguna regla de texto va a resolver esto bien. El catalogo si: si eso no
   * es un ejercicio y si es un alimento, era una pregunta de comida.
   */
  if (intent.kind === "exerciseSubstitute") {
    const asExercise = await findCatalogExercise(intent.exerciseName);
    if (!asExercise) {
      const asFood = await findCatalogFoodByPhrase(intent.exerciseName);
      if (asFood) intent = { kind: "foodMissing", foodName: asFood.name };
    }
  }

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
 * Borra el historial del copiloto.
 *
 * Es destructivo y no se puede deshacer, asi que la interfaz pide confirmacion
 * antes de llamar aqui. El dato es de salud: poder retirarlo es parte del trato,
 * no una opcion avanzada escondida.
 */
export async function forgetConversations(): Promise<
  { error: string } | { deleted: number }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.assistant.actionFailed };

  const result = await deleteAllConversations(user.id);
  if ("error" in result) return { error: messages.assistant.forgetFailed };

  revalidatePath("/configuracion");
  return result;
}
