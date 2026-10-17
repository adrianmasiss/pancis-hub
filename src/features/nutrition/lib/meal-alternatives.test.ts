import { describe, it, expect } from "vitest";
import { rankMealAlternatives } from "./meal-alternatives";
import type { ComparisonMeal } from "../compare-queries";
const totals = {
  calories: 400,
  proteinG: 30,
  carbohydrateG: 50,
  fatG: 10,
  fiberG: 5,
};
const reference: ComparisonMeal = {
  id: "a",
  label: "Almuerzo",
  mealType: "almuerzo",
  items: [{ name: "Arroz", quantityG: 100, macros: totals }],
  totals,
};
describe("alternativas de comidas", () => {
  it("distingue similitud de uso de cercanía nutricional y excluye el original", () => {
    const sameType = {
      ...reference,
      id: "b",
      totals: { ...totals, proteinG: 5 },
    };
    const nearest = {
      ...reference,
      id: "c",
      mealType: "cena",
      items: [],
      totals: { ...totals, calories: 410 },
    };
    expect(
      rankMealAlternatives(
        reference,
        [reference, sameType, nearest],
        "similar",
      ).map((m) => m.id),
    ).toEqual(["b"]);
    expect(
      rankMealAlternatives(
        reference,
        [reference, sameType, nearest],
        "macros",
      ).map((m) => m.id),
    ).toEqual(["c", "b"]);
  });
  it("reconoce ingredientes en común sin depender de acentos", () => {
    const other = {
      ...reference,
      id: "b",
      mealType: "cena",
      items: [{ ...reference.items[0]!, name: "ARRÓZ" }],
    };
    expect(rankMealAlternatives(reference, [other], "similar")).toHaveLength(1);
  });
});
