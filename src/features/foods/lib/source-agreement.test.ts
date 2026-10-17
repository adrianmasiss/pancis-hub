import { describe, expect, it } from "vitest";
import {
  agreementVerdict,
  readingLabel,
  formatDivergence,
  listSources,
  macroDisagreements,
  type SourceAgreement,
  type SourceReading,
} from "./source-agreement";

const lectura = (
  source: SourceReading["source"],
  extra: Partial<SourceReading> = {},
): SourceReading => ({
  source,
  externalId: `${source}-1`,
  externalName: null,
  calories: 100,
  proteinG: 10,
  carbohydrateG: 10,
  fatG: 10,
  fiberG: 1,
  ...extra,
});

const acuerdo = (
  readings: SourceReading[],
  maxDivergencePct: number | null,
): SourceAgreement => ({
  readings,
  canonical: readings[0]?.source ?? null,
  maxDivergencePct,
});

describe("agreementVerdict", () => {
  it("no afirma nada con una sola fuente", () => {
    expect(agreementVerdict(acuerdo([lectura("usda")], null))).toEqual({
      kind: "sola",
    });
  });

  it("no afirma nada sin alimento", () => {
    expect(agreementVerdict(null)).toEqual({ kind: "sola" });
  });

  it("una divergencia nula entre dos fuentes es el acuerdo mas fuerte", () => {
    // No es falta de dato: es que ningun macro llego a la diferencia minima.
    // Tratarlo como «no se puede afirmar nada» dejaba sin sello justamente a
    // los alimentos en los que las dos fuentes coinciden del todo.
    const sin = acuerdo([lectura("usda"), lectura("openfoodfacts")], null);
    expect(agreementVerdict(sin)).toEqual({
      kind: "corroborado",
      others: ["openfoodfacts"],
      divergencePct: null,
    });
  });

  it("corrobora cuando las dos fuentes se parecen", () => {
    // El caso real: Rellenitas de Galletas GN, 500 kcal en las dos.
    const a = acuerdo([lectura("openfoodfacts"), lectura("usda")], 0.7);
    expect(agreementVerdict(a)).toEqual({
      kind: "corroborado",
      others: ["usda"],
      divergencePct: 0.7,
    });
  });

  it("manda a revisar cuando no se parecen", () => {
    // El caso real: Cap'n Crunch, 150 kcal en OFF contra 405 en USDA.
    const a = acuerdo([lectura("openfoodfacts"), lectura("usda")], 63);
    expect(agreementVerdict(a)).toEqual({
      kind: "discrepa",
      others: ["usda"],
      divergencePct: 63,
    });
  });

  it("el umbral es inclusivo: 15 todavia es parecerse", () => {
    const a = acuerdo([lectura("openfoodfacts"), lectura("usda")], 15);
    expect(agreementVerdict(a).kind).toBe("corroborado");
  });

  it("no cuenta dos veces la misma fuente", () => {
    // Dos filas de USDA del mismo alimento no son dos fuentes independientes
    // para quien lee el sello, pero si son un desacuerdo que revisar.
    const a = acuerdo([lectura("usda"), lectura("usda")], 20);
    expect(agreementVerdict(a)).toEqual({ kind: "sola" });
    const b = acuerdo([lectura("usda"), lectura("usda")], null);
    expect(agreementVerdict(b)).toEqual({ kind: "sola" });
  });
});

describe("macroDisagreements", () => {
  it("ordena por desacuerdo y dice los dos valores", () => {
    const canonica = lectura("usda", { calories: 405, carbohydrateG: 86.5 });
    const otra = lectura("openfoodfacts", { calories: 150, carbohydrateG: 32 });
    const salida = macroDisagreements(canonica, otra);
    expect(salida[0]!.key).toBe("carbohydrateG");
    expect(salida[0]!.canonical).toBe(86.5);
    expect(salida[0]!.other).toBe(32);
    expect(Math.round(salida[0]!.divergencePct)).toBe(63);
  });

  it("calla las cantidades diminutas", () => {
    // 0,0 g contra 0,7 g de grasa es el doble en porcentaje y nada en el plato.
    const canonica = lectura("usda", { fatG: 0 });
    const otra = lectura("openfoodfacts", { fatG: 0.7 });
    expect(macroDisagreements(canonica, otra)).toEqual([]);
  });

  it("ignora lo que una fuente no midio", () => {
    const canonica = lectura("usda", { proteinG: null });
    const otra = lectura("openfoodfacts", { proteinG: 40 });
    expect(macroDisagreements(canonica, otra).map((d) => d.key)).not.toContain(
      "proteinG",
    );
  });

  it("calla la diferencia que no cambia ninguna comida", () => {
    // El caso real: «Cheese, Mexican blend» encabezaba la cola con un 95,8 %
    // que salia de 0,1 g contra 2,4 g de carbohidratos.
    const canonica = lectura("usda", { carbohydrateG: 0.1 });
    const otra = lectura("usda", { carbohydrateG: 2.4 });
    expect(macroDisagreements(canonica, otra)).toEqual([]);
  });

  it("sigue cazando el error de carga de verdad", () => {
    // Cap'n Crunch: el valor por porcion escrito en la casilla de por 100 g.
    const canonica = lectura("usda", { calories: 405 });
    const otra = lectura("openfoodfacts", { calories: 150 });
    const salida = macroDisagreements(canonica, otra);
    expect(salida).toHaveLength(1);
    expect(Math.round(salida[0]!.divergencePct)).toBe(63);
  });

  it("no lista lo que coincide", () => {
    expect(macroDisagreements(lectura("usda"), lectura("dietly"))).toEqual([]);
  });
});

describe("listSources", () => {
  it("enumera en prosa", () => {
    expect(listSources(["usda"])).toBe("USDA");
    expect(listSources(["usda", "openfoodfacts"])).toBe(
      "USDA y Open Food Facts",
    );
    expect(listSources(["usda", "openfoodfacts", "dietly"])).toBe(
      "USDA, Open Food Facts y Dietly",
    );
  });
});

describe("formatDivergence", () => {
  it("usa la coma decimal de es-419", () => {
    expect(formatDivergence(0.7)).toBe("0,7 %");
    expect(formatDivergence(63)).toBe("63 %");
  });
});

describe("readingLabel", () => {
  const usdaA = lectura("usda", { externalId: "a", calories: 384 });
  const usdaB = lectura("usda", { externalId: "b", calories: 362 });
  const off = lectura("openfoodfacts");

  it("usa solo el nombre cuando la fuente no se repite", () => {
    expect(readingLabel(usdaA, [usdaA, off])).toBe("USDA");
  });

  it("anade las calorias cuando hay dos de la misma fuente", () => {
    // Si no, la cola ofrecia «Usar el de USDA» dos veces, palabra por palabra.
    expect(readingLabel(usdaA, [usdaA, usdaB])).toBe("USDA · 384 kcal");
    expect(readingLabel(usdaB, [usdaA, usdaB])).toBe("USDA · 362 kcal");
  });

  it("no inventa una cifra que la fuente no dio", () => {
    const sinEnergia = lectura("usda", { externalId: "c", calories: null });
    expect(readingLabel(sinEnergia, [sinEnergia, usdaB])).toBe("USDA");
  });
});
