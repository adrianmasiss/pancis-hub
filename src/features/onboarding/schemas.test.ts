import { describe, expect, it } from "vitest";
import {
  activitySchema,
  baselineSchema,
  basicsSchema,
  goalSchema,
  nutritionPreferencesSchema,
  parseCommaList,
} from "./schemas";

const validBasics = {
  displayName: "Demo",
  birthDate: "1996-03-15",
  biologicalSex: "femenino",
  heightCm: 165,
  unitSystem: "metric",
  timezone: "America/Costa_Rica",
};

describe("basicsSchema", () => {
  it("acepta datos validos", () => {
    expect(basicsSchema.safeParse(validBasics).success).toBe(true);
  });

  it("rechaza menores de 18 anos", () => {
    const thisYear = new Date().getFullYear();
    const result = basicsSchema.safeParse({
      ...validBasics,
      birthDate: `${thisYear - 10}-01-01`,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza alturas fuera de rango", () => {
    expect(
      basicsSchema.safeParse({ ...validBasics, heightCm: 90 }).success,
    ).toBe(false);
    expect(
      basicsSchema.safeParse({ ...validBasics, heightCm: 300 }).success,
    ).toBe(false);
  });

  it("rechaza nombre vacio", () => {
    expect(
      basicsSchema.safeParse({ ...validBasics, displayName: "  " }).success,
    ).toBe(false);
  });
});

describe("goalSchema", () => {
  it("acepta los cuatro objetivos", () => {
    for (const goal of [
      "recomposicion",
      "perdida_grasa",
      "ganancia_muscular",
      "mantenimiento",
    ]) {
      expect(goalSchema.safeParse({ primaryGoal: goal }).success).toBe(true);
    }
  });

  it("rechaza objetivos desconocidos", () => {
    expect(goalSchema.safeParse({ primaryGoal: "volumen" }).success).toBe(
      false,
    );
  });
});

describe("activitySchema", () => {
  const valid = {
    experienceLevel: "intermedio",
    trainingDaysPerWeek: 4,
    activityLevel: "moderado",
  };

  it("acepta datos validos sin opcionales", () => {
    expect(activitySchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza mas de 7 dias por semana", () => {
    expect(
      activitySchema.safeParse({ ...valid, trainingDaysPerWeek: 8 }).success,
    ).toBe(false);
  });

  it("acepta pasos diarios opcionales dentro de rango", () => {
    expect(
      activitySchema.safeParse({ ...valid, dailySteps: 8000 }).success,
    ).toBe(true);
    expect(
      activitySchema.safeParse({ ...valid, dailySteps: 90000 }).success,
    ).toBe(false);
  });
});

describe("nutritionPreferencesSchema", () => {
  it("requiere comidas por dia en rango", () => {
    expect(
      nutritionPreferencesSchema.safeParse({ mealsPerDay: 4 }).success,
    ).toBe(true);
    expect(
      nutritionPreferencesSchema.safeParse({ mealsPerDay: 0 }).success,
    ).toBe(false);
  });
});

describe("baselineSchema", () => {
  const valid = {
    weightKg: 70,
    measuredAt: "2026-07-01",
    measurementSource: "manual",
  };

  it("acepta solo peso obligatorio", () => {
    expect(baselineSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza pesos fuera de rango", () => {
    expect(baselineSchema.safeParse({ ...valid, weightKg: 20 }).success).toBe(
      false,
    );
    expect(baselineSchema.safeParse({ ...valid, weightKg: 400 }).success).toBe(
      false,
    );
  });

  it("rechaza fechas futuras", () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(
      baselineSchema.safeParse({ ...valid, measuredAt: `${nextYear}-01-01` })
        .success,
    ).toBe(false);
  });

  it("rechaza porcentaje de grasa fuera de rango", () => {
    expect(
      baselineSchema.safeParse({ ...valid, bodyFatPercentage: 80 }).success,
    ).toBe(false);
  });
});

describe("parseCommaList", () => {
  it("separa y limpia elementos", () => {
    expect(parseCommaList("mani, lacteos ,  gluten")).toEqual([
      "mani",
      "lacteos",
      "gluten",
    ]);
  });

  it("devuelve lista vacia para undefined o cadena vacia", () => {
    expect(parseCommaList(undefined)).toEqual([]);
    expect(parseCommaList("")).toEqual([]);
    expect(parseCommaList(" , ,")).toEqual([]);
  });
});
