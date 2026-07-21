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
