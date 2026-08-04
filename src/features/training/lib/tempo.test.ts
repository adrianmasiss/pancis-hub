import { describe, expect, it } from "vitest";
import {
  VERY_SLOW_SECONDS,
  interpretTempo,
  parseTempo,
  tempoDurationSeconds,
} from "./tempo";

describe("parseTempo", () => {
  it("lee el formato de cuatro fases", () => {
    expect(parseTempo("2-0-1-0")).toEqual({
      eccentric: 2,
      bottomPause: 0,
      concentric: 1,
      topPause: 0,
    });
  });

  it("admite espacios y dos puntos", () => {
    expect(parseTempo("3 1 1 0")).toEqual({
      eccentric: 3,
      bottomPause: 1,
      concentric: 1,
      topPause: 0,
    });
    expect(parseTempo("3:1:1:0")?.eccentric).toBe(3);
  });

  it('"X" cuenta como explosivo, o sea 0', () => {
    expect(parseTempo("3-0-X-0")?.concentric).toBe(0);
  });

  /**
   * 07A: "cadencia 2" es ambiguo y hay que PREGUNTAR si significa dos
   * segundos excentricos o dos segundos totales. Adivinarlo seria lo
   * contrario de lo que pide el documento.
   */
  it("no adivina un tempo ambiguo", () => {
    expect(parseTempo("cadencia 2")).toBeNull();
    expect(parseTempo("2")).toBeNull();
    expect(parseTempo("2-1")).toBeNull();
    expect(parseTempo("")).toBeNull();
  });

  it("rechaza valores absurdos", () => {
    expect(parseTempo("2-0-1-99")).toBeNull();
    expect(parseTempo("-1-0-1-0")).toBeNull();
  });
});

describe("interpretTempo", () => {
  it("un tempo normal no se marca como lento", () => {
    const advice = interpretTempo("2-0-1-0")!;

    expect(advice.durationSeconds).toBe(3);
    expect(advice.tooSlow).toBe(false);
    // Y no promete que el tempo haga ganar mas musculo.
    expect(advice.note).toContain("no cambia gran cosa");
  });

  /**
   * BIO-006: Schoenfeld 2015 encuentra hipertrofia similar entre 0.5 y 8 s
   * por repeticion. El rango util es tan amplio que casi nada se marca.
   */
  it("un tempo de 8 segundos sigue dentro de lo razonable", () => {
    const advice = interpretTempo("4-1-2-1")!;

    expect(advice.durationSeconds).toBe(8);
    expect(advice.tooSlow).toBe(false);
  });

  it("solo avisa por encima de 10 segundos por repeticion", () => {
    const advice = interpretTempo("6-2-4-1")!;

    expect(advice.durationSeconds).toBeGreaterThan(VERY_SLOW_SECONDS);
    expect(advice.tooSlow).toBe(true);
    expect(advice.note).toContain("reduce la carga");
  });

  it("devuelve null si el texto no es un tempo", () => {
    expect(interpretTempo("rapido")).toBeNull();
  });
});

describe("tempoDurationSeconds", () => {
  it("suma las cuatro fases", () => {
    expect(
      tempoDurationSeconds({
        eccentric: 3,
        bottomPause: 1,
        concentric: 1,
        topPause: 0,
      }),
    ).toBe(5);
  });
});
