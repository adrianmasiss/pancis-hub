import { describe, expect, it } from "vitest";
import { rebalanceDay } from "@/features/nutrition/lib/rebalance";
import type { MacroSet } from "@/features/nutrition/lib/macros";

const target: MacroSet = {
  calories: 2200,
  proteinG: 165,
  carbohydrateG: 220,
  fatG: 70,
  fiberG: 30,
};

const consumed = (overrides: Partial<MacroSet> = {}): MacroSet => ({
  calories: 1500,
  proteinG: 120,
  carbohydrateG: 150,
  fatG: 50,
  fiberG: 20,
  ...overrides,
});

describe("rebalanceDay", () => {
  it("calcula lo que resta del objetivo", () => {
    const { remaining } = rebalanceDay({
      target,
      consumed: consumed(),
      pendingMeals: 2,
    });
    expect(remaining).toEqual({
      calories: 700,
      proteinG: 45,
      carbohydrateG: 70,
      fatG: 20,
      fiberG: 10,
    });
  });

  it("permite restante negativo cuando se excede el objetivo", () => {
    const { remaining } = rebalanceDay({
      target,
      consumed: consumed({ calories: 2500, proteinG: 200 }),
      pendingMeals: 0,
    });
    expect(remaining.calories).toBe(-300);
    expect(remaining.proteinG).toBe(-35);
  });

  it("no sugiere nada cuando la desviacion cabe en el margen de error", () => {
    const { suggestions } = rebalanceDay({
      target,
      consumed: consumed({
        calories: 2150,
        proteinG: 160,
        carbohydrateG: 215,
        fatG: 66,
        fiberG: 27,
      }),
      pendingMeals: 1,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]!.macro).toBeNull();
    expect(suggestions[0]!.severity).toBe("informativa");
  });

  it("marca severidad alta cuando la desviacion es grande", () => {
    const { suggestions } = rebalanceDay({
      target,
      consumed: consumed({ proteinG: 100 }),
      pendingMeals: 2,
    });
    const protein = suggestions.find((s) => s.macro === "proteinG");
    expect(protein?.severity).toBe("alta");
    expect(protein?.deviation).toBe(65);
  });

  it("prioriza la proteina sobre el resto a igual severidad", () => {
    const { suggestions } = rebalanceDay({
      target,
      consumed: consumed({ proteinG: 135, fatG: 50 }),
      pendingMeals: 2,
    });
    expect(suggestions[0]!.macro).toBe("proteinG");
  });

  it("ordena primero lo mas grave", () => {
    const { suggestions } = rebalanceDay({
      target,
      // Solo se desvian carbohidratos (alta) y grasas (media); calorias,
      // proteina y fibra quedan en el objetivo para aislar el orden.
      consumed: consumed({
        calories: 2200,
        proteinG: 165,
        carbohydrateG: 100,
        fatG: 59,
        fiberG: 30,
      }),
      pendingMeals: 2,
    });
    expect(suggestions[0]!.macro).toBe("carbohydrateG");
    expect(suggestions[0]!.severity).toBe("alta");
    expect(suggestions[1]!.macro).toBe("fatG");
    expect(suggestions[1]!.severity).toBe("media");
  });

  it("distingue el mensaje de exceso del de deficit", () => {
    const excess = rebalanceDay({
      target,
      consumed: consumed({ calories: 2600 }),
      pendingMeals: 1,
    });
    const excessCalories = excess.suggestions.find(
      (s) => s.macro === "calories",
    );
    expect(excessCalories?.message).toContain("pasaste");
    expect(excessCalories?.deviation).toBeLessThan(0);

    const deficit = rebalanceDay({
      target,
      consumed: consumed({ calories: 1200 }),
      pendingMeals: 1,
    });
    const deficitCalories = deficit.suggestions.find(
      (s) => s.macro === "calories",
    );
    expect(deficitCalories?.message).toContain("faltan");
    expect(deficitCalories?.deviation).toBeGreaterThan(0);
  });

  it("cambia el consejo cuando ya no quedan comidas pendientes", () => {
    const { suggestions } = rebalanceDay({
      target,
      consumed: consumed({ proteinG: 100 }),
      pendingMeals: 0,
    });
    const protein = suggestions.find((s) => s.macro === "proteinG");
    // Sin comidas por delante no se puede repartir el ajuste en el dia.
    expect(protein?.message).toContain("ya no quedan comidas");
    expect(protein?.message).not.toContain("Prioriza una fuente magra");
  });

  it("confirma explicitamente cuando el dia cierra dentro del objetivo", () => {
    const { suggestions } = rebalanceDay({
      target,
      consumed: target,
      pendingMeals: 0,
    });
    expect(suggestions[0]!.message).toBe("El dia cerro dentro de tu objetivo.");
  });
});
