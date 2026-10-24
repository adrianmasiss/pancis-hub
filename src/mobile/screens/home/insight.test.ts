import { describe, expect, it } from "vitest";
import { homeInsight, type InsightInput } from "./insight";

const base: InsightInput = {
  hour: 10,
  extraKcal: 0,
  trainingDayName: null,
  trainingBasis: null,
  proteinGoalG: 120,
  proteinConsumedG: 0,
  waterTargetMl: 2400,
  waterMl: 0,
  nextMeal: null,
};

describe("homeInsight", () => {
  it("sin nada relevante no da consejo", () => {
    expect(homeInsight(base)).toBeNull();
  });

  it("el ajuste por entreno va primero y cita las kcal", () => {
    const r = homeInsight({
      ...base,
      hour: 18,
      extraKcal: 150,
      trainingDayName: "Día B",
      trainingBasis: "previsto",
    });
    expect(r?.text).toContain("Hoy entrenas (Día B)");
    expect(r?.text).toContain("150 kcal");
  });

  it("avisa de una comida con más de una hora de atraso", () => {
    const r = homeInsight({
      ...base,
      hour: 9,
      nextMeal: { name: "Desayuno", time: "07:00:00" },
    });
    expect(r?.text).toContain("07:00");
  });

  it("no avisa si la comida aún está en hora", () => {
    expect(
      homeInsight({
        ...base,
        hour: 7,
        nextMeal: { name: "Desayuno", time: "07:00" },
      }),
    ).toBeNull();
  });

  it("la proteína solo desde media tarde y si falta más de un tercio", () => {
    expect(homeInsight({ ...base, hour: 14 })).toBeNull();
    expect(
      homeInsight({ ...base, hour: 16, proteinConsumedG: 100, waterMl: 2400 }),
    ).toBeNull();
    expect(
      homeInsight({ ...base, hour: 16, proteinConsumedG: 40 })?.text,
    ).toContain("80 g de proteína");
  });

  it("el agua cuando va por debajo de la mitad", () => {
    const r = homeInsight({
      ...base,
      hour: 16,
      proteinConsumedG: 120,
      waterMl: 500,
    });
    expect(r?.text).toContain("0,5 de 2,4 L");
  });
});
