import { google } from "@ai-sdk/google";
import { APICallError, RetryError } from "ai";

/**
 * Dos niveles de modelo, cada uno con su propia cuota gratuita.
 *
 * - `fino`: el que razona mejor. Su cuota gratuita es la escasa (20 al dia en
 *   gemini-2.5-flash, medido), asi que se guarda para lo que la necesita:
 *   preguntas abiertas, fotos, leer un PDF o un informe.
 * - `rapido`: un modelo lite con cuota mucho mas holgada. Explica resultados
 *   que ya calcularon los motores propios y da formato a texto ya escrito.
 *
 * Como las cuotas son por modelo, si uno se agota el otro sigue respondiendo
 * (ver `withGeminiFallback`).
 */
export type GeminiTier = "rapido" | "fino";

const DEFAULT_MODELS: Record<GeminiTier, string> = {
  fino: "gemini-2.5-flash",
  rapido: "gemini-3.1-flash-lite",
};

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function geminiModelId(tier: GeminiTier = "fino"): string {
  const fromEnv =
    tier === "fino"
      ? process.env.GEMINI_MODEL
      : process.env.GEMINI_MODEL_RAPIDO;
  return fromEnv?.trim() || DEFAULT_MODELS[tier];
}

export function getGeminiModel(tier: GeminiTier = "fino") {
  return getGeminiModelById(geminiModelId(tier));
}

/**
 * Modelo para buscar con Google Search. Va aparte de los niveles porque en el
 * plan gratuito solo gemini-2.5-flash acepta la busqueda (medido 2026-11-08:
 * 3.5-flash, 3.1-flash-lite y flash-lite-latest responden 429 con ella). Asi,
 * cambiar GEMINI_MODEL por uno mas nuevo no rompe la busqueda, y no hay
 * respaldo: el otro modelo tambien daria 429.
 */
export function getGeminiSearchModel() {
  return getGeminiModelById(
    process.env.GEMINI_MODEL_BUSQUEDA?.trim() || "gemini-2.5-flash",
  );
}

function getGeminiModelById(modelId: string) {
  if (!hasGeminiApiKey()) {
    throw new Error(
      "Configura GOOGLE_GENERATIVE_AI_API_KEY en .env.local para usar Gemini.",
    );
  }
  return google(modelId);
}

/**
 * Cuota agotada (429), modelo saturado (503/500) o retirado (404): fallos del
 * MODELO, que otro modelo puede no tener. Un tiempo agotado no entra: probar
 * otro modelo duplicaria la espera de alguien que ya espero de mas.
 */
export function isModelUnavailable(error: unknown): boolean {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (!APICallError.isInstance(cause)) return false;
  return [404, 429, 500, 503].includes(cause.statusCode ?? 0);
}

/**
 * Ejecuta con el nivel pedido y, si ese modelo no esta disponible, una vez con
 * el otro. Asi agotar la cuota del fino no deja la funcion sin IA, y una
 * saturacion del lite no la deja sin respuesta.
 */
export async function withGeminiFallback<T>(
  tier: GeminiTier,
  run: (
    model: ReturnType<typeof getGeminiModel>,
    tier: GeminiTier,
  ) => Promise<T>,
): Promise<T> {
  try {
    return await run(getGeminiModel(tier), tier);
  } catch (error) {
    if (!isModelUnavailable(error)) throw error;
    const other: GeminiTier = tier === "fino" ? "rapido" : "fino";
    if (geminiModelId(other) === geminiModelId(tier)) throw error;
    console.warn(
      `Gemini ${geminiModelId(tier)} no disponible; se usa ${geminiModelId(other)}.`,
    );
    return run(getGeminiModel(other), other);
  }
}
