import { describe, expect, it } from "vitest";
import {
  findRestrictionMatch,
  matchesRestriction,
  singularize,
  tokenize,
} from "./allergens";

describe("singularize", () => {
  it("resuelve el plural irregular en -ces", () => {
    expect(singularize("nueces")).toBe("nuez");
  });

  it("resuelve plurales regulares", () => {
    expect(singularize("huevos")).toBe("huevo");
    expect(singularize("camarones")).toBe("camaron");
    expect(singularize("lacteos")).toBe("lacteo");
  });

  it("no toca palabras cortas", () => {
    expect(singularize("mas")).toBe("mas");
  });
});

describe("tokenize", () => {
  it("quita tildes, separa por palabra y descarta conectores", () => {
    expect(tokenize("Nuez de la India")).toEqual(["nuez", "india"]);
    expect(tokenize("Yogurt griego sin azúcar")).toEqual([
      "yogurt",
      "griego",
      "azucar",
    ]);
  });
});

describe("matchesRestriction: los casos que rompian antes", () => {
  it('"leche" NO excluye "lechuga"', () => {
    expect(matchesRestriction("Lechuga romana", ["leche"])).toBe(false);
  });

  it('"leche" sí excluye "Leche entera"', () => {
    expect(matchesRestriction("Leche entera", ["leche"])).toBe(true);
  });

  it('"nuez" sí excluye "Nuez de la India"', () => {
    expect(matchesRestriction("Nuez de la India", ["nuez"])).toBe(true);
  });

  it("el plural del alimento también cuenta", () => {
    expect(matchesRestriction("Nueces mixtas", ["nuez"])).toBe(true);
  });

  it("el plural de la restricción también cuenta", () => {
    expect(matchesRestriction("Nuez de la India", ["nueces"])).toBe(true);
  });
});

describe("matchesRestriction: grupos", () => {
  it('declarar "lácteos" excluye queso, yogur y mantequilla', () => {
    const restricciones = ["lácteos"];
    expect(matchesRestriction("Queso turrialba", restricciones)).toBe(true);
    expect(matchesRestriction("Yogurt griego", restricciones)).toBe(true);
    expect(matchesRestriction("Mantequilla sin sal", restricciones)).toBe(true);
  });

  it('declarar "lácteos" no excluye pollo ni arroz', () => {
    const restricciones = ["lácteos"];
    expect(matchesRestriction("Pechuga de pollo", restricciones)).toBe(false);
    expect(matchesRestriction("Arroz blanco cocido", restricciones)).toBe(false);
  });

  it('"gluten" excluye pan y pasta', () => {
    expect(matchesRestriction("Pan integral", ["gluten"])).toBe(true);
    expect(matchesRestriction("Pasta de trigo", ["gluten"])).toBe(true);
  });

  it('"mariscos" excluye camarones pero no pescado blanco', () => {
    expect(matchesRestriction("Camarones cocidos", ["mariscos"])).toBe(true);
    expect(matchesRestriction("Tilapia a la plancha", ["mariscos"])).toBe(false);
  });

  // EQ-004: el sesamo es alergeno mayor declarable y faltaba en la lista.
  it("el sésamo se detecta por sus tres nombres", () => {
    expect(matchesRestriction("Pan con sésamo", ["sésamo"])).toBe(true);
    expect(matchesRestriction("Aceite de ajonjolí", ["sésamo"])).toBe(true);
    expect(matchesRestriction("Tahini", ["sésamo"])).toBe(true);
  });

  it("el sésamo no arrastra falsos positivos", () => {
    expect(matchesRestriction("Pan integral", ["sésamo"])).toBe(false);
  });

  it("crustáceos y moluscos son grupos distintos", () => {
    expect(matchesRestriction("Camarones cocidos", ["crustáceos"])).toBe(true);
    expect(matchesRestriction("Calamar a la romana", ["crustáceos"])).toBe(
      false,
    );
    expect(matchesRestriction("Calamar a la romana", ["moluscos"])).toBe(true);
    expect(matchesRestriction("Camarones cocidos", ["moluscos"])).toBe(false);
  });

  it('"mariscos" funciona como paraguas de los dos', () => {
    expect(matchesRestriction("Camarones cocidos", ["mariscos"])).toBe(true);
    expect(matchesRestriction("Calamar a la romana", ["mariscos"])).toBe(true);
    expect(matchesRestriction("Mejillones al vapor", ["mariscos"])).toBe(true);
  });

  it("los alérgenos de menor prevalencia también se cubren", () => {
    expect(matchesRestriction("Mostaza Dijon", ["mostaza"])).toBe(true);
    expect(matchesRestriction("Apio en rama", ["apio"])).toBe(true);
    expect(matchesRestriction("Vino con metabisulfito", ["sulfitos"])).toBe(
      true,
    );
  });

  it("el maní se trata aparte de los frutos secos", () => {
    expect(matchesRestriction("Mantequilla de maní", ["frutos secos"])).toBe(
      false,
    );
    expect(matchesRestriction("Mantequilla de maní", ["maní"])).toBe(true);
  });
});

describe("findRestrictionMatch", () => {
  it("explica qué término disparó la exclusión", () => {
    const match = findRestrictionMatch("Queso mozzarella", ["lácteos"]);
    expect(match).toEqual({ restriction: "lácteos", matchedTerm: "queso" });
  });

  it("devuelve null cuando no aplica ninguna", () => {
    expect(findRestrictionMatch("Banano maduro", ["lácteos", "gluten"])).toBe(
      null,
    );
  });

  it("ignora restricciones vacías o de una letra", () => {
    expect(matchesRestriction("Leche entera", ["", " ", "a"])).toBe(false);
  });

  it("sin restricciones declaradas no excluye nada", () => {
    expect(matchesRestriction("Leche entera", [])).toBe(false);
  });
});
