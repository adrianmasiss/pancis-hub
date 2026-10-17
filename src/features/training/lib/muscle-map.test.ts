import { describe, expect, it } from "vitest";
import {
  musculosDe,
  resaltadoDeEjercicios,
  MUSCULOS_DEL_MANIQUI,
  ROTULOS,
} from "./muscle-map";

describe("traduccion del vocabulario", () => {
  it("traduce lo que el catalogo usa de verdad", () => {
    expect(musculosDe("pecho")).toEqual(["pectoral"]);
    expect(musculosDe("isquiotibiales")).toEqual(["isquios"]);
    expect(musculosDe("gluteos")).toEqual(["gluteo"]);
    expect(musculosDe("espalda baja")).toEqual(["lumbar"]);
  });

  it("un termino generico enciende los dos vientres que lo componen", () => {
    expect(musculosDe("core")).toEqual(["abdomen", "oblicuo"]);
    expect(musculosDe("hombros")).toEqual(["deltoides", "deltoides-post"]);
  });

  it("no se casa con las tildes ni con las mayusculas", () => {
    expect(musculosDe("  Glúteos ")).toEqual(["gluteo"]);
    expect(musculosDe("BÍCEPS")).toEqual(["biceps"]);
  });

  it("traduce todo lo que produce el importador del catalogo", () => {
    /* Si el importador emite un termino que esta tabla no conoce, el maniqui
       se queda apagado para esos ejercicios y nadie se entera. */
    const delImportador = [
      "abdominales",
      "core",
      "oblicuos",
      "pecho",
      "espalda",
      "espalda baja",
      "trapecio",
      "hombros",
      "hombro posterior",
      "biceps",
      "triceps",
      "antebrazo",
      "gluteos",
      "abductores",
      "cuadriceps",
      "isquiotibiales",
      "aductores",
      "gemelos",
    ];
    for (const termino of delImportador) {
      expect(musculosDe(termino).length).toBeGreaterThan(0);
    }
  });

  it("lo desconocido se ignora en vez de inventarse", () => {
    expect(musculosDe("serrato")).toEqual([]);
    expect(musculosDe("")).toEqual([]);
  });

  it("todo lo que traduce existe en el maniqui", () => {
    const validos = new Set<string>(MUSCULOS_DEL_MANIQUI);
    for (const termino of ["pecho", "core", "hombros", "espalda", "gemelos"]) {
      for (const musculo of musculosDe(termino)) {
        expect(validos.has(musculo)).toBe(true);
      }
    }
  });

  it("cada vientre tiene rotulo", () => {
    for (const musculo of MUSCULOS_DEL_MANIQUI) {
      expect(ROTULOS[musculo]).toBeTruthy();
    }
  });
});

describe("resaltado del dia", () => {
  it("principal pesa 1 y asistente 0.5", () => {
    expect(
      resaltadoDeEjercicios([
        { primaryMuscle: "pecho", secondaryMuscles: ["triceps"] },
      ]),
    ).toEqual({ pectoral: 1, triceps: 0.5 });
  });

  it("si un musculo es principal en un ejercicio, manda el principal", () => {
    const mapa = resaltadoDeEjercicios([
      { primaryMuscle: "pecho", secondaryMuscles: ["triceps"] },
      { primaryMuscle: "triceps", secondaryMuscles: [] },
    ]);
    expect(mapa.triceps).toBe(1);
  });

  it("suma los ejercicios del dia sin repetir", () => {
    const mapa = resaltadoDeEjercicios([
      { primaryMuscle: "cuadriceps", secondaryMuscles: ["gluteos", "core"] },
      { primaryMuscle: "gluteos", secondaryMuscles: ["isquiotibiales"] },
    ]);
    expect(mapa).toEqual({
      cuadriceps: 1,
      gluteo: 1,
      abdomen: 0.5,
      oblicuo: 0.5,
      isquios: 0.5,
    });
  });

  it("aguanta un dia vacio y campos ausentes", () => {
    expect(resaltadoDeEjercicios([])).toEqual({});
    expect(resaltadoDeEjercicios([{}])).toEqual({});
    expect(
      resaltadoDeEjercicios([{ primaryMuscle: null, secondaryMuscles: null }]),
    ).toEqual({});
  });
});
