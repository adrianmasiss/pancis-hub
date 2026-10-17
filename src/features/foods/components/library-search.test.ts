import { describe, expect, it } from "vitest";
import { rankSuggestions } from "./library-search";

describe("rankSuggestions", () => {
  it("pone primero lo que empieza con lo escrito y los nombres cortos", () => {
    const ranked = rankSuggestions(
      [
        { name: '"FRIED RICE" CAULIFLOWER CRUMBLES WITH TERIYAKI SAUCE' },
        { name: "Pan de arroz" },
        { name: "Arroz blanco" },
        { name: "Arroz" },
      ],
      "arr",
    ).map((item) => item.name);
    expect(ranked).toEqual([
      "Arroz",
      "Arroz blanco",
      "Pan de arroz",
      '"FRIED RICE" CAULIFLOWER CRUMBLES WITH TERIYAKI SAUCE',
    ]);
  });

  it("la palabra entera gana a la que solo empieza igual", () => {
    const ranked = rankSuggestions(
      [{ name: "ALASKA POLLOCK" }, { name: "Pechuga de pollo" }],
      "pollo",
    );
    expect(ranked[0]!.name).toBe("Pechuga de pollo");
  });

  it("no repite el mismo nombre", () => {
    const ranked = rankSuggestions(
      [{ name: "Arroz" }, { name: "arroz" }, { name: "Arroz blanco" }],
      "arr",
    );
    expect(ranked).toHaveLength(2);
  });

  it("ignora tildes y mayusculas", () => {
    const ranked = rankSuggestions(
      [{ name: "Leche" }, { name: "Brócoli" }],
      "broc",
    );
    expect(ranked[0]!.name).toBe("Brócoli");
  });
});
