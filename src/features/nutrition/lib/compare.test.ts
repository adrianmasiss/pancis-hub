import { describe, expect, it } from "vitest";
import { compareVerdict, macroDifference, scalePortion } from "./compare";
import type { MacroSet } from "./macros";

const macros = (extra: Partial<MacroSet> = {}): MacroSet => ({
  calories: 100,
  proteinG: 10,
  carbohydrateG: 10,
  fatG: 10,
  fiberG: 1,
  ...extra,
});

describe("scalePortion", () => {
  it("escala desde los 100 g del catalogo", () => {
    const avena = {
      calories: 389,
      proteinG: 16.9,
      carbohydrateG: 66.3,
      fatG: 6.9,
      fiberG: 10.6,
    };
    expect(scalePortion(avena, 50)).toEqual({
      calories: 195,
      proteinG: 8.5,
      carbohydrateG: 33.2,
      fatG: 3.5,
      fiberG: 5.3,
    });
  });

  it("no inventa precision que la etiqueta no tiene", () => {
    // 33,15 g no se redondea a 33,15: la fuente no sostiene dos decimales.
    const salida = scalePortion(
      { calories: 100, proteinG: 33.333, carbohydrateG: 0, fatG: 0, fiberG: 0 },
      100,
    );
    expect(salida.proteinG).toBe(33.3);
    expect(Number.isInteger(salida.calories)).toBe(true);
  });

  it("una cantidad de cero no aporta nada", () => {
    expect(
      scalePortion(
        { calories: 500, proteinG: 1, carbohydrateG: 1, fatG: 1, fiberG: 1 },
        0,
      ),
    ).toEqual({
      calories: 0,
      proteinG: 0,
      carbohydrateG: 0,
      fatG: 0,
      fiberG: 0,
    });
  });
});

describe("macroDifference", () => {
  it("es B menos A, no al reves", () => {
    const d = macroDifference(
      macros({ calories: 500 }),
      macros({ calories: 420 }),
    );
    expect(d.calories).toBe(-80);
  });

  it("deja los gramos en un decimal", () => {
    const d = macroDifference(
      macros({ proteinG: 10.04 }),
      macros({ proteinG: 12.37 }),
    );
    expect(d.proteinG).toBe(2.3);
  });
});

describe("compareVerdict", () => {
  it("llama similar a lo que no cambia el dia", () => {
    // 30 kcal sobre 700 es ruido.
    const a = macros({ calories: 700 });
    expect(
      compareVerdict(a, macroDifference(a, macros({ calories: 730 }))),
    ).toBe("similar");
  });

  it("el umbral es relativo: las mismas 30 kcal sobre 200 si importan", () => {
    const a = macros({ calories: 200 });
    expect(
      compareVerdict(a, macroDifference(a, macros({ calories: 230 }))),
    ).toBe("mas");
  });

  it("distingue arriba de abajo", () => {
    const a = macros({ calories: 500 });
    expect(
      compareVerdict(a, macroDifference(a, macros({ calories: 300 }))),
    ).toBe("menos");
  });

  it("no divide entre cero", () => {
    const vacio = macros({ calories: 0 });
    expect(
      compareVerdict(vacio, macroDifference(vacio, macros({ calories: 0 }))),
    ).toBe("similar");
    expect(
      compareVerdict(vacio, macroDifference(vacio, macros({ calories: 90 }))),
    ).toBe("mas");
  });
});
