/**
 * Contratos del asistente contextual (docs/08_AI_ENGINE.md).
 *
 * La UI y las acciones dependen solo de estos tipos: un proveedor real
 * de IA podra sustituir al deterministico sin tocar el resto.
 */

export type AssistantConfidence = "baja" | "media" | "alta";

/** Formato estructurado obligatorio de respuesta. */
export type AssistantReply = {
  observation: string;
  interpretation: string;
  confidence: AssistantConfidence;
  action: string;
  alternative?: string;
  reason: string;
  reevaluate: string;
};

export type AssistantContext = {
  displayName: string;
  primaryGoal: string | null;
  targets: {
    calories: number;
    proteinG: number;
    carbohydrateG: number;
    fatG: number;
  } | null;
  consumedToday: {
    calories: number;
    proteinG: number;
    carbohydrateG: number;
    fatG: number;
  };
  weightWeeklyChange: number | null;
  weightTrend: "sube" | "baja" | "estable" | null;
  sleepHoursToday: number | null;
  activePlanName: string | null;
  activeDiet: {
    name: string;
    meals: {
      name: string;
      items: { foodName: string; quantityG: number }[];
    }[];
  } | null;
};

export type AssistantIntent =
  | { kind: "foodMissing"; foodName: string }
  | { kind: "exerciseMissing" }
  | { kind: "eatingOut" }
  | { kind: "proteinShort" }
  | { kind: "poorSleep" }
  | { kind: "weightStall" }
  | { kind: "recipeIdea"; ingredients: string }
  | { kind: "timingShift" }
  | { kind: "fallback" };

export type FoodAlternativeSuggestion = {
  name: string;
  suggestedQuantityG: number;
  caloriesDiff: number;
};

export interface AssistantProvider {
  generateReply(input: {
    context: AssistantContext;
    intent: AssistantIntent;
    foodAlternatives?: FoodAlternativeSuggestion[];
  }): AssistantReply;
}
