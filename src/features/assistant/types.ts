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
  /**
   * De donde salen las cifras que menciona la respuesta. Se resuelven desde
   * `formula_versions`, no las inventa el modelo: si esta vacio, es que la
   * respuesta no se apoya en ninguna constante trazable.
   */
  sources?: {
    title: string;
    identifier: string | null;
    evidenceGrade: "A" | "B" | "C" | "D" | null;
    population: string | null;
    /** `sustenta`, `matiza` o `contradice`: que hace esta fuente por la cifra. */
    role: string | null;
    /** El matiz registrado al aprobar el claim, si lo hay. */
    note: string | null;
    isProductParameter: boolean;
  }[];
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
  /**
   * Explicacion de la constante por la que se pregunto, leida de
   * `formula_versions`. La rellena la server action.
   */
  formulaExplanation?: {
    label: string;
    value: string;
    rationale: string;
    limitations: string | null;
    isProductParameter: boolean;
  } | null;
  /** Comidas del dia que siguen pendientes. */
  pendingMeals: number;
  /** Hallazgo mas prioritario de la rutina activa, si lo hay. */
  routineTopFinding: { priority: string; title: string; detail: string } | null;
  /** Series semanales por musculo de la rutina activa. */
  weeklySetsByMuscle: { muscle: string; sets: number }[];
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
  | { kind: "exerciseSubstitute"; exerciseName: string }
  | { kind: "setsAndReps"; exerciseName: string }
  | { kind: "routineReview" }
  /**
   * "por que mi objetivo de proteina es ese numero". Se responde SIN IA:
   * el valor, su justificacion y sus fuentes estan en formula_versions.
   */
  | { kind: "whyThisNumber"; formulaKey: string }
  | { kind: "fallback" };

export type FoodAlternativeSuggestion = {
  name: string;
  suggestedQuantityG: number;
  caloriesDiff: number;
};

/** Alternativa de ejercicio ya comparada por el motor biomecanico. */
export type ExerciseAlternativeSuggestion = {
  name: string;
  compatibility: number;
  recommendation: string;
};

/** Esquema sugerido por el motor de prescripcion. */
export type PrescriptionSuggestion = {
  exerciseName: string;
  summary: string;
  topReason: string;
  progression: string;
};

export interface AssistantProvider {
  generateReply(input: {
    context: AssistantContext;
    intent: AssistantIntent;
    foodAlternatives?: FoodAlternativeSuggestion[];
    exerciseAlternatives?: ExerciseAlternativeSuggestion[];
    prescription?: PrescriptionSuggestion | null;
  }): AssistantReply;
}
