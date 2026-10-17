import { describe, expect, it } from "vitest";
import { labelToPer100g, type LabelReading } from "./nutrition-label";

const base: LabelReading = {
  isNutritionLabel: true,
  name: "Galletas de avena",
  brand: "Pozuelo",
  foodGroup: "carbohidrato",
  basis: "per100g",
  servingSizeG: null,
  calories: 452,
  proteinG: 7.1,
  carbohydrateG: 68.4,
  fatG: 16.2,
  fiberG: 4,
  sugarG: 22.5,
  sodiumMg: 310,
};

describe("labelToPer100g", () => {
  it("keeps per-100 g values as read", () => {
    const result = labelToPer100g(base);
    expect("values" in result && result.values.calories).toBe(452);
    expect("values" in result && result.values.proteinG).toBe(7.1);
  });

  it("scales per-serving values by 100 / serving", () => {
    const result = labelToPer100g({
      ...base,
      basis: "perServing",
      servingSizeG: 30,
      calories: 135,
      proteinG: 2.1,
      sodiumMg: 93,
    });
    if (!("values" in result)) throw new Error("expected values");
    expect(result.values.calories).toBe(450);
    expect(result.values.proteinG).toBe(7);
    expect(result.values.sodiumMg).toBe(310);
  });

  it("refuses to guess a per-serving label without a serving size", () => {
    const result = labelToPer100g({
      ...base,
      basis: "perServing",
      servingSizeG: null,
    });
    expect(result).toHaveProperty("error");
  });

  it("keeps missing values as null, not zero", () => {
    const result = labelToPer100g({ ...base, fiberG: null, sugarG: null });
    if (!("values" in result)) throw new Error("expected values");
    expect(result.values.fiberG).toBeNull();
    expect(result.values.sugarG).toBeNull();
  });

  it("rejects an image that is not a label", () => {
    expect(labelToPer100g({ ...base, isNutritionLabel: false })).toHaveProperty(
      "error",
    );
  });

  it("rejects a label with no energy and no macros", () => {
    expect(
      labelToPer100g({
        ...base,
        calories: null,
        proteinG: null,
        carbohydrateG: null,
        fatG: null,
      }),
    ).toHaveProperty("error");
  });

  it("drops negative or non-finite numbers", () => {
    const result = labelToPer100g({ ...base, fatG: -3, fiberG: Number.NaN });
    if (!("values" in result)) throw new Error("expected values");
    expect(result.values.fatG).toBeNull();
    expect(result.values.fiberG).toBeNull();
  });
});
