import { describe, expect, it } from "vitest";
import {
  perServing,
  recipeTotals,
  scaleIngredientsToServings,
} from "./recipe-macros";

const avena = {
  per100g: {
    calories: 389,
    proteinG: 16.9,
    carbohydrateG: 66,
    fatG: 6.9,
    fiberG: 10.6,
  },
  quantityG: 100,
};

const leche = {
  per100g: {
    calories: 34,
    proteinG: 3.4,
    carbohydrateG: 5,
    fatG: 0.1,
    fiberG: 0,
  },
  quantityG: 400,
};

describe("recipeTotals", () => {
  it("suma los macros de todos los ingredientes escalados", () => {
    const totals = recipeTotals([avena, leche]);
    // avena 100 g = 389 kcal; leche 400 g = 136 kcal -> 525
    expect(totals.calories).toBe(525);
    expect(totals.proteinG).toBe(30.5);
  });

  it("receta vacia da cero", () => {
    expect(recipeTotals([]).calories).toBe(0);
  });
});

describe("perServing", () => {
  it("divide entre las porciones con redondeo", () => {
    const serving = perServing(
      {
        calories: 525,
        proteinG: 30.5,
        carbohydrateG: 86,
        fatG: 7.3,
        fiberG: 10.6,
      },
      2,
    );
    expect(serving.calories).toBe(263);
    expect(serving.proteinG).toBe(15.3);
  });

  it("porciones invalidas caen a 1", () => {
    const totals = {
      calories: 100,
      proteinG: 10,
      carbohydrateG: 5,
      fatG: 2,
      fiberG: 1,
    };
    expect(perServing(totals, 0).calories).toBe(100);
  });
});

describe("scaleIngredientsToServings", () => {
  it("escala cantidades a las porciones deseadas", () => {
    const scaled = scaleIngredientsToServings(
      [{ quantityG: 100 }, { quantityG: 400 }],
      4,
      2,
    );
    expect(scaled).toEqual([50, 200]);
  });

  it("puede escalar hacia arriba", () => {
    expect(scaleIngredientsToServings([{ quantityG: 80 }], 2, 3)).toEqual([
      120,
    ]);
  });
});
