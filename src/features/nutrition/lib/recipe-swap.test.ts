import { describe, expect, it } from "vitest";
import {
  rankRecipeMatches,
  scaleServings,
  suggestServings,
  type RecipeOption,
} from "@/features/nutrition/lib/recipe-swap";
import type { MacroSet } from "@/features/nutrition/lib/macros";

const almuerzo: MacroSet = {
  calories: 600,
  proteinG: 45,
  carbohydrateG: 60,
  fatG: 18,
  fiberG: 8,
};

const recipe = (
  name: string,
  perServing: MacroSet,
  id = name,
): RecipeOption => ({ id, name, perServing, imageUrl: null });

describe("suggestServings", () => {
  it("ancla en calorias para acercarse a la comida", () => {
    const perServing = { ...almuerzo, calories: 300 };
    expect(suggestServings(almuerzo, perServing)).toBe(2);
  });

  it("redondea a medias porciones", () => {
    // 600 / 240 = 2.5
    const perServing = { ...almuerzo, calories: 240 };
    expect(suggestServings(almuerzo, perServing)).toBe(2.5);
  });

  it("no baja de media porcion ni sube de cuatro", () => {
    expect(suggestServings(almuerzo, { ...almuerzo, calories: 5000 })).toBe(0.5);
    expect(suggestServings(almuerzo, { ...almuerzo, calories: 10 })).toBe(4);
  });

  it("no divide por cero si la receta no tiene calorias", () => {
    expect(suggestServings(almuerzo, { ...almuerzo, calories: 0 })).toBe(1);
  });
});

describe("scaleServings", () => {
  it("escala los macros de una porcion", () => {
    const result = scaleServings(
      { calories: 300, proteinG: 20, carbohydrateG: 30, fatG: 9, fiberG: 4 },
      2.5,
    );
    expect(result).toEqual({
      calories: 750,
      proteinG: 50,
      carbohydrateG: 75,
      fatG: 22.5,
      fiberG: 10,
    });
  });
});

describe("rankRecipeMatches", () => {
  const cercana = recipe("Bowl de pollo", {
    calories: 300,
    proteinG: 23,
    carbohydrateG: 30,
    fatG: 9,
    fiberG: 4,
  });
  const lejana = recipe("Panqueques dulces", {
    calories: 300,
    proteinG: 6,
    carbohydrateG: 55,
    fatG: 7,
    fiberG: 1,
  });

  it("pone primero la receta mas parecida a la comida", () => {
    const results = rankRecipeMatches(almuerzo, [lejana, cercana]);
    expect(results[0]!.recipe.name).toBe("Bowl de pollo");
    expect(results[0]!.compatibility.overall).toBeGreaterThan(
      results[1]!.compatibility.overall,
    );
  });

  it("sugiere las porciones y calcula la diferencia real", () => {
    const results = rankRecipeMatches(almuerzo, [cercana]);
    const match = results[0]!;
    expect(match.servings).toBe(2);
    expect(match.macros.calories).toBe(600);
    expect(match.diff.calories).toBe(0);
    // Dos porciones dan 46 g de proteina frente a los 45 planificados.
    expect(match.diff.proteinG).toBe(1);
  });

  it("penaliza la receta que se desvia en proteina", () => {
    const results = rankRecipeMatches(almuerzo, [lejana]);
    expect(results[0]!.compatibility.proteinG).toBeLessThan(5);
  });

  it("descarta recetas sin calorias en vez de dividir por cero", () => {
    const vacia = recipe("Receta sin ingredientes", {
      calories: 0,
      proteinG: 0,
      carbohydrateG: 0,
      fatG: 0,
      fiberG: 0,
    });
    expect(rankRecipeMatches(almuerzo, [vacia])).toHaveLength(0);
  });

  it("respeta el maximo de resultados", () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      recipe(`Receta ${index}`, cercana.perServing, `r${index}`),
    );
    expect(rankRecipeMatches(almuerzo, many, 3)).toHaveLength(3);
  });
});
