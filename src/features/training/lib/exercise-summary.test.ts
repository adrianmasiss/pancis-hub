import { describe, expect, it } from "vitest";
import { shortSummary } from "./exercise-summary";

describe("shortSummary", () => {
  it("prefiere el resumen guardado", () => {
    expect(shortSummary({ summary: " Corto. ", instructions: "Largo." })).toBe(
      "Corto.",
    );
  });

  it("sin resumen, toma hasta tres frases de la explicación", () => {
    expect(
      shortSummary({ instructions: "Uno. Dos. Tres. Cuatro. Cinco." }),
    ).toBe("Uno. Dos. Tres.");
  });

  it("no pasa de 260 caracteres salvo que la primera frase ya sea larga", () => {
    const larga = `${"a".repeat(200)}. ${"b".repeat(100)}.`;
    expect(shortSummary({ instructions: larga })).toBe(`${"a".repeat(200)}.`);
  });

  it("nada que resumir es nulo", () => {
    expect(shortSummary({ summary: null, instructions: "  " })).toBeNull();
  });
});
