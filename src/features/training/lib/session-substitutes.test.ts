import { describe, expect, it } from "vitest";
import { compareMuscles, rankSubstitutes } from "./session-substitutes";

const ex = (
  id: string,
  primaryMuscle: string,
  secondaryMuscles: string[] = [],
  extra: { movementPattern?: string; equipment?: string } = {},
) => ({
  id,
  name: id,
  primaryMuscle,
  secondaryMuscles,
  movementPattern: extra.movementPattern ?? null,
  equipment: extra.equipment ?? null,
});

describe("compareMuscles", () => {
  it("mismos músculos es 100 %", () => {
    const remo = ex("remo", "espalda", ["biceps"]);
    expect(
      compareMuscles(remo, ex("otro", "espalda", ["biceps"])).similarity,
    ).toBe(100);
  });

  it("cuenta lo compartido, lo que se pierde y lo que se suma", () => {
    const remo = ex("remo", "espalda", ["biceps", "trapecio"]);
    const jalon = ex("jalon", "espalda", ["biceps", "antebrazo"]);
    const m = compareMuscles(remo, jalon);
    // común 2+1 = 3; total 2+1+1+1 = 5.
    expect(m.similarity).toBe(60);
    expect(m.shared).toEqual(["biceps", "espalda"]);
    expect(m.lost).toEqual(["trapecio"]);
    expect(m.added).toEqual(["antebrazo"]);
  });

  it("otro principal pesa: el secundario no lo compensa", () => {
    const press = ex("press", "pecho", ["triceps"]);
    const fondos = ex("fondos", "triceps", ["pecho"]);
    // común 1+1 = 2; total 2+2 = 4.
    expect(compareMuscles(press, fondos).similarity).toBe(50);
  });
});

describe("rankSubstitutes", () => {
  it("excluye el original y desempata por patrón y equipo", () => {
    const source = ex("remo", "espalda", [], {
      movementPattern: "traccion horizontal",
      equipment: "mancuerna",
    });
    const ranked = rankSubstitutes(source, [
      source,
      ex("a-jalon", "espalda", [], { movementPattern: "traccion vertical" }),
      ex("b-remo-polea", "espalda", [], {
        movementPattern: "traccion horizontal",
        equipment: "polea",
      }),
      ex("c-curl", "biceps"),
    ]);
    expect(ranked.map((m) => m.exercise.id)).toEqual([
      "b-remo-polea",
      "a-jalon",
    ]);
  });
});
