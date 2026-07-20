import { google } from "@ai-sdk/google";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function getGeminiModel(modelId = process.env.GEMINI_MODEL) {
  if (!hasGeminiApiKey()) {
    throw new Error(
      "Configura GOOGLE_GENERATIVE_AI_API_KEY en .env.local para usar Gemini.",
    );
  }

  return google(modelId?.trim() || DEFAULT_GEMINI_MODEL);
}
