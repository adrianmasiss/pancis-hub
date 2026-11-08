import { describe, expect, it } from "vitest";
import type { LibraryFood } from "../queries";
import { rankDayFoods } from "./day-search-rank";

const food = (name: string, brand: string | null = null) =>
  ({ id: name, name, brand }) as LibraryFood;

describe("rankDayFoods", () => {
  it("lo que solo coincide por alias va al final", () => {
    const ranked = rankDayFoods("pollo", [
      food("Abadejo, del Atlántico, cocido"),
      food("Ala de pollo"),
      food("Pechuga de pollo"),
      food("Pollo entero"),
    ]).map((f) => f.name);
    expect(ranked).toEqual([
      "Pollo entero",
      "Ala de pollo",
      "Pechuga de pollo",
      "Abadejo, del Atlántico, cocido",
    ]);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(
      rankDayFoods("platano", [food("Arroz"), food("Plátano maduro")])[0]!.name,
    ).toBe("Plátano maduro");
  });
});
