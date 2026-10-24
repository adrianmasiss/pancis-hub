import { describe, expect, it } from "vitest";
import { foodFacts } from "./food-facts";

const texts = (f: Parameters<typeof foodFacts>[0]) =>
  foodFacts(f).map((x) => x.text);

describe("foodFacts", () => {
  it("pechuga: alta en proteína y nada más", () => {
    expect(
      texts({
        calories: 165,
        proteinG: 31,
        carbohydrateG: 0,
        fatG: 3.6,
        fiberG: 0,
        sugarG: 0,
        sodiumMg: 74,
      }),
    ).toEqual(["Alto en proteína"]);
  });

  it("frijoles: proteína y fibra", () => {
    expect(
      texts({
        calories: 132,
        proteinG: 8.9,
        carbohydrateG: 24,
        fatG: 0.5,
        fiberG: 8.7,
      }),
    ).toEqual(["Alto en proteína", "Alto en fibra"]);
  });

  it("galleta: azúcar, grasa, calorías y sin fibra", () => {
    expect(
      texts({
        calories: 480,
        proteinG: 5,
        carbohydrateG: 65,
        fatG: 22,
        fiberG: 0.5,
        sugarG: 30,
        sodiumMg: 300,
      }),
    ).toEqual(["Alto en azúcar", "Alto en grasa", "Muy calórico", "Sin fibra"]);
  });

  it("sin dato de azúcar o sodio no inventa nada", () => {
    expect(
      texts({
        calories: 50,
        proteinG: 1,
        carbohydrateG: 12,
        fatG: 0,
        fiberG: 2,
        sugarG: null,
        sodiumMg: null,
      }),
    ).toEqual([]);
  });

  it("rico en: sólo los tres micronutrientes más altos sobre el 20 %", () => {
    expect(
      texts({
        calories: 30,
        proteinG: 1,
        carbohydrateG: 5,
        fatG: 0,
        fiberG: 2,
        micronutrients: {
          vit_c_mg: 90,
          folate_ug: 200,
          iron_mg: 4,
          potassium_mg: 1000,
          calcium_mg: 100,
        },
      }),
    ).toEqual(["Rico en vitamina C", "Rico en folato", "Rico en hierro"]);
  });
});
