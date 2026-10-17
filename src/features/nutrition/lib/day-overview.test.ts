import { describe, expect, it } from "vitest";
import {
  consumedTotals,
  pendingPlanTotals,
  resolveNutritionDate,
} from "./day-overview";
import type { MacroSet } from "./macros";

const macros = (calories: number): MacroSet => ({
  calories,
  proteinG: 10,
  carbohydrateG: 20,
  fatG: 5,
  fiberG: 2,
});

describe("resumen de nutrición", () => {
  it("cuenta solo comidas consumidas, incluidas las sustituidas", () => {
    expect(
      consumedTotals([
        { status: "completada", totals: macros(300) },
        { status: "completada_con_cambios", totals: macros(250) },
        { status: "planificada", totals: macros(600) },
        { status: "omitida", totals: macros(400) },
      ]),
    ).toEqual({
      calories: 550,
      proteinG: 20,
      carbohydrateG: 40,
      fatG: 10,
      fiberG: 4,
    });
  });

  it("no duplica en pendientes las comidas del plan ya registradas", () => {
    expect(
      pendingPlanTotals([
        { loggedToday: true, totals: macros(300) },
        { loggedToday: false, totals: macros(600) },
      ]).calories,
    ).toBe(600);
    expect(consumedTotals([]).calories).toBe(0);
  });

  it("rechaza fechas imposibles y conserva fechas válidas", () => {
    expect(resolveNutritionDate("2026-02-30", "2026-09-27")).toBe("2026-09-27");
    expect(resolveNutritionDate(["2026-09-26"], "2026-09-27")).toBe(
      "2026-09-27",
    );
    expect(resolveNutritionDate("2026-09-26", "2026-09-27")).toBe("2026-09-26");
  });
});
