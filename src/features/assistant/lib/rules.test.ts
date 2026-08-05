import { describe, expect, it } from "vitest";
import { detectIntent, deterministicProvider } from "./rules";
import type { AssistantContext } from "@/features/assistant/types";

describe("detectIntent", () => {
  it("detecta alimento faltante y extrae el nombre", () => {
    expect(detectIntent("No tengo arroz")).toEqual({
      kind: "foodMissing",
      foodName: "arroz",
    });
    expect(detectIntent("no tengo el pollo")).toEqual({
      kind: "foodMissing",
      foodName: "pollo",
    });
  });

  it("detecta maquina faltante antes que alimento", () => {
    expect(detectIntent("No tengo la maquina de este ejercicio").kind).toBe(
      "exerciseMissing",
    );
  });

  it("detecta comer fuera", () => {
    expect(detectIntent("Hoy voy a comer pizza").kind).toBe("eatingOut");
  });

  it("detecta proteina incompleta", () => {
    expect(detectIntent("No llegue a la proteina hoy").kind).toBe(
      "proteinShort",
    );
  });

  it("detecta sueno pobre con y sin acentos", () => {
    expect(detectIntent("Dormi poco").kind).toBe("poorSleep");
    expect(detectIntent("Dormí poco anoche").kind).toBe("poorSleep");
  });

  it("detecta estancamiento de peso", () => {
    expect(detectIntent("Mi peso no cambia").kind).toBe("weightStall");
  });

  it("detecta ideas de receta con ingredientes", () => {
    const intent = detectIntent("¿Que preparo con pollo y tortillas?");
    expect(intent.kind).toBe("recipeIdea");
  });

  it("cae al fallback con mensajes fuera de alcance", () => {
    expect(detectIntent("hola").kind).toBe("fallback");
  });

  it("detecta que el usuario quiere sustituir un ejercicio", () => {
    const intent = detectIntent("no puedo hacer sentadilla, me molesta la rodilla");
    expect(intent.kind).toBe("exerciseSubstitute");
    if (intent.kind === "exerciseSubstitute") {
      expect(intent.exerciseName).toContain("sentadilla");
    }
  });

  it("detecta preguntas de series y repeticiones", () => {
    const intent = detectIntent("cuantas series de press de banca hago");
    expect(intent.kind).toBe("setsAndReps");
  });

  it("detecta la peticion de revisar la rutina", () => {
    expect(detectIntent("revisa mi rutina").kind).toBe("routineReview");
  });
});

const context: AssistantContext = {
  displayName: "Demo",
  primaryGoal: "recomposicion",
  targets: { calories: 2091, proteinG: 126, carbohydrateG: 271, fatG: 56 },
  consumedToday: { calories: 900, proteinG: 60, carbohydrateG: 100, fatG: 25 },
  weightWeeklyChange: -0.1,
  weightTrend: "estable",
  sleepHoursToday: 5.5,
  activePlanName: "Full body",
  pendingMeals: 2,
  routineTopFinding: {
    priority: "mejora",
    title: "Patrones de movimiento sin cubrir",
    detail: "No aparece ningun ejercicio de: bisagra de cadera.",
  },
  weeklySetsByMuscle: [
    { muscle: "cuadriceps", sets: 12 },
    { muscle: "espalda", sets: 10 },
  ],
  activeDiet: null,
};

describe("deterministicProvider", () => {
  it("proteinShort usa los datos reales del dia", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "proteinShort" },
    });
    expect(reply.observation).toContain("60 g");
    expect(reply.observation).toContain("126 g");
    expect(reply.confidence).toBe("media");
  });

  it("weightStall reporta el cambio semanal y pide promedios", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "weightStall" },
    });
    expect(reply.observation).toContain("-0.1 kg");
    expect(reply.reevaluate.toLowerCase()).toContain("semana");
  });

  it("foodMissing incluye alternativas cuando existen", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "foodMissing", foodName: "arroz" },
      foodAlternatives: [
        { name: "Papa", suggestedQuantityG: 280, caloriesDiff: -16 },
      ],
    });
    expect(reply.action).toContain("Papa");
    expect(reply.action).toContain("280 g");
  });

  it("todas las respuestas cumplen el formato estructurado", () => {
    const intents = [
      { kind: "eatingOut" },
      { kind: "poorSleep" },
      { kind: "exerciseMissing" },
      { kind: "timingShift" },
      { kind: "fallback" },
    ] as const;
    for (const intent of intents) {
      const reply = deterministicProvider.generateReply({ context, intent });
      expect(reply.observation.length).toBeGreaterThan(0);
      expect(reply.interpretation.length).toBeGreaterThan(0);
      expect(["baja", "media", "alta"]).toContain(reply.confidence);
      expect(reply.action.length).toBeGreaterThan(0);
      expect(reply.reason.length).toBeGreaterThan(0);
      expect(reply.reevaluate.length).toBeGreaterThan(0);
    }
  });
});

describe("respuestas de entrenamiento", () => {
  it("usa las alternativas del motor biomecanico y su compatibilidad", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "exerciseSubstitute", exerciseName: "sentadilla" },
      exerciseAlternatives: [
        {
          name: "Prensa de pierna",
          compatibility: 8.2,
          recommendation: "Sustituto muy cercano de Sentadilla.",
        },
      ],
    });
    expect(reply.action).toContain("Prensa de pierna");
    expect(reply.action).toContain("8.2/10");
    expect(reply.confidence).toBe("media");
  });

  it("baja la confianza si no encuentra el ejercicio", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "exerciseSubstitute", exerciseName: "inventado" },
      exerciseAlternatives: [],
    });
    expect(reply.confidence).toBe("baja");
  });

  it("responde series y repeticiones con el motor de prescripcion", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "setsAndReps", exerciseName: "sentadilla" },
      prescription: {
        exerciseName: "Sentadilla con barra",
        summary: "4 x 5-10 · RIR 2 · 150s",
        topReason: "Es un ejercicio compuesto.",
        progression: "Cuando completes 10 repeticiones, sube la carga.",
      },
    });
    expect(reply.action).toContain("4 x 5-10");
    // El requisito 13 exige que no exista un esquema universal.
    expect(reply.interpretation).toContain("no existe un 4x12 universal");
  });

  it("resume la rutina con el hallazgo mas prioritario", () => {
    const reply = deterministicProvider.generateReply({
      context,
      intent: { kind: "routineReview" },
    });
    expect(reply.interpretation).toContain("Patrones de movimiento sin cubrir");
    expect(reply.alternative).toContain("cuadriceps 12");
  });
});

describe('"por que ese numero" se responde sin IA', () => {
  it("detecta la pregunta por el origen de una cifra", () => {
    expect(detectIntent("por que mi objetivo de proteina es ese numero?")).toEqual(
      { kind: "whyThisNumber", formulaKey: "protein_ranges" },
    );
    expect(detectIntent("de donde sale mi descanso entre series?")).toEqual({
      kind: "whyThisNumber",
      formulaKey: "min_rest_seconds",
    });
  });

  /**
   * "por que no llegue a la proteina" es una pregunta distinta: el usuario no
   * pregunta el origen del numero, pregunta por su dia. Las intenciones mas
   * especificas tienen que ganar.
   */
  it("no pisa a las intenciones especificas", () => {
    expect(detectIntent("hoy no llegue a la proteina").kind).toBe(
      "proteinShort",
    );
  });

  it("una pregunta por un tema sin constante cae al fallback", () => {
    expect(detectIntent("por que el cielo es azul?").kind).toBe("fallback");
  });

  /**
   * Quien pregunta quiere saber por que le toco SU numero. Devolver solo el
   * rango contesta otra pregunta: hay que decir su valor y que sale del punto
   * medio, que es como lo calcula `calculateTargets`.
   */
  it("da el numero del usuario y de donde sale dentro del rango", () => {
    const reply = deterministicProvider.generateReply({
      context: {
        ...context,
        formulaExplanation: {
          label: "Tu rango de proteina",
          value: "1.8 a 2.2 g/kg de peso corporal",
          rationale: "La necesidad cambia con el objetivo.",
          limitations: "Las mujeres estan infrarrepresentadas en esta literatura.",
          isProductParameter: false,
        },
      },
      intent: { kind: "whyThisNumber", formulaKey: "protein_ranges" },
    });

    expect(reply.observation).toContain("126 g");
    expect(reply.observation).toContain("punto medio");
    expect(reply.confidence).toBe("alta");
    // Las limitaciones se dicen, no se guardan para el pie de pagina.
    expect(reply.alternative).toContain("infrarrepresentadas");
  });

  /** Un parametro de producto no puede presentarse con confianza alta. */
  it("baja la confianza cuando la cifra es un criterio de la app", () => {
    const reply = deterministicProvider.generateReply({
      context: {
        ...context,
        formulaExplanation: {
          label: "La referencia de agua",
          value: "35 ml/kg",
          rationale: "Aproximacion practica.",
          limitations: null,
          isProductParameter: true,
        },
      },
      intent: { kind: "whyThisNumber", formulaKey: "water_ml_per_kg" },
    });

    expect(reply.confidence).toBe("baja");
    expect(reply.action).toContain("criterio de la app");
  });
});
