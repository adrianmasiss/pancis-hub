import type { GeminiTier } from "@/lib/ai/google";
import type { AssistantIntent } from "@/features/assistant/types";

/**
 * Quien contesta cada pregunta del copiloto.
 *
 * - `reglas`: el motor propio, sin IA. Solo donde la respuesta ya esta escrita
 *   y revisada y un modelo solo podria empeorarla: un sintoma clinico (derivar,
 *   siempre igual) y el "por que de este numero" con explicacion registrada.
 * - `rapido`: el modelo lite. Las intenciones cuyos datos ya calcularon los
 *   motores (alternativas, prescripcion, ajustes del dia): el modelo explica y
 *   adapta, no razona desde cero.
 * - `fino`: el modelo bueno, con la cuota escasa. Preguntas abiertas que piden
 *   criterio, analisis de varios datos a la vez, fotos, o cuando el usuario
 *   pidio expresamente un analisis a fondo.
 */
export type AssistantRoute = GeminiTier | "reglas";

/** Palabras que piden criterio, no un dato. */
const NEEDS_JUDGEMENT =
  /\b(por que|porque|conviene|deberia|vale la pena|analiza|compara|evalua|estrategia|que opinas|es mejor|recomiendas|explica|ayuno|suplement|creatina|estancad|meseta|deficit|superavit|recomposicion)\b|\bvs\b/;

/** Intenciones donde hay que cruzar varios datos del usuario. */
const ANALYSIS_INTENTS = new Set<AssistantIntent["kind"]>([
  "routineReview",
  "weightStall",
]);

/** Una pregunta larga casi siempre trae contexto que hay que sopesar. */
const LONG_QUESTION = 160;

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function routeAssistantQuestion(input: {
  message: string;
  intent: AssistantIntent;
  /** "Por que este numero" con texto aprobado en `formula_versions`. */
  explainedFromRegistry: boolean;
  hasImage: boolean;
  /** El usuario pidio "Analizar a fondo". */
  deep: boolean;
}): AssistantRoute {
  // Seguridad y texto aprobado primero: ni el pedido "a fondo" los cambia.
  if (input.intent.kind === "clinicalSymptom") return "reglas";
  if (input.explainedFromRegistry) return "reglas";

  if (input.deep || input.hasImage) return "fino";
  if (ANALYSIS_INTENTS.has(input.intent.kind)) return "fino";

  if (input.intent.kind === "fallback") {
    const text = normalize(input.message);
    if (NEEDS_JUDGEMENT.test(text) || text.length > LONG_QUESTION) {
      return "fino";
    }
  }

  return "rapido";
}
