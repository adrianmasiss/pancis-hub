import { describe, expect, it } from "vitest";
import {
  isCompound,
  recommendPrescription,
  formatPrescription,
} from "@/features/training/lib/prescription";
import type { BiomechanicalExercise } from "@/features/training/lib/biomechanics";

const sentadilla: BiomechanicalExercise = {
  id: "1",
  name: "Sentadilla con barra",
  primaryMuscle: "cuadriceps",
  secondaryMuscles: ["gluteos"],
  movementPattern: "sentadilla",
  equipment: "barra",
  difficulty: "intermedio",
  joints: ["cadera", "rodilla", "tobillo"],
  resistanceProfile: "ascendente",
  hardestPoint: null,
  stability: 4,
  rangeOfMotion: 9,
  technicalDemand: 7,
  systemicFatigue: 9,
  progressionEase: 8,
  isUnilateral: false,
  commonErrors: [],
  techniqueCues: [],
  imageUrl: null,
  imageEndUrl: null,
};

const curl: BiomechanicalExercise = {
  ...sentadilla,
  id: "2",
  name: "Curl de biceps",
  primaryMuscle: "biceps",
  secondaryMuscles: [],
  movementPattern: "flexion de codo",
  joints: ["codo"],
  stability: 7,
  rangeOfMotion: 7,
  technicalDemand: 2,
  systemicFatigue: 2,
  progressionEase: 7,
};

describe("isCompound", () => {
  it("distingue compuesto de aislamiento por articulaciones y fatiga", () => {
    expect(isCompound(sentadilla)).toBe(true);
    expect(isCompound(curl)).toBe(false);
  });
});

describe("recommendPrescription", () => {
  const base = { goal: "hipertrofia", experience: "intermedio" } as const;

  // El requisito 13 prohibe explicitamente repetir un esquema fijo.
  it("no prescribe lo mismo a un compuesto que a un aislamiento", () => {
    const pesado = recommendPrescription(sentadilla, base);
    const ligero = recommendPrescription(curl, base);

    expect(pesado.repsMax).toBeLessThan(ligero.repsMax);
    expect(pesado.restSeconds).toBeGreaterThan(ligero.restSeconds);
  });

  it("cambia el esquema segun el objetivo", () => {
    const fuerza = recommendPrescription(sentadilla, {
      ...base,
      goal: "fuerza",
    });
    const resistencia = recommendPrescription(sentadilla, {
      ...base,
      goal: "resistencia",
    });

    expect(fuerza.repsMax).toBeLessThan(resistencia.repsMin);
    expect(fuerza.restSeconds).toBeGreaterThan(resistencia.restSeconds);
  });

  it("deja mas margen al fallo y menos series a un principiante", () => {
    const novato = recommendPrescription(curl, {
      ...base,
      experience: "principiante",
    });
    const avanzado = recommendPrescription(curl, {
      ...base,
      experience: "avanzado",
    });

    expect(novato.rir).toBeGreaterThan(avanzado.rir);
    expect(novato.sets).toBeLessThanOrEqual(avanzado.sets);
    expect(novato.reasons.some((r) => r.includes("tecnica"))).toBe(true);
  });

  it("recorta series cuando el ejercicio va al final de la sesion", () => {
    const primero = recommendPrescription(curl, {
      ...base,
      positionInSession: 1,
    });
    const ultimo = recommendPrescription(curl, {
      ...base,
      positionInSession: 5,
    });

    expect(ultimo.sets).toBeLessThan(primero.sets);
    expect(ultimo.reasons.some((r) => r.includes("posicion 5"))).toBe(true);
  });

  it("recorta volumen si el musculo ya acumula muchas series semanales", () => {
    const normal = recommendPrescription(curl, {
      ...base,
      weeklySetsForMuscle: 8,
    });
    const saturado = recommendPrescription(curl, {
      ...base,
      weeklySetsForMuscle: 24,
    });

    expect(saturado.sets).toBeLessThan(normal.sets);
    expect(saturado.reasons.some((r) => r.includes("24"))).toBe(true);
  });

  it("avisa que las series de un unilateral son por lado", () => {
    const zancadas = recommendPrescription(
      { ...curl, isUnilateral: true },
      base,
    );
    expect(zancadas.reasons.some((r) => r.includes("POR LADO"))).toBe(true);
  });

  it("siempre explica de donde sale el esquema", () => {
    const result = recommendPrescription(sentadilla, base);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    expect(result.progression).toContain("sube la carga");
  });

  it("mantiene los valores en rangos seguros", () => {
    const extremo = recommendPrescription(
      { ...sentadilla, technicalDemand: 10, systemicFatigue: 10 },
      {
        goal: "fuerza",
        experience: "principiante",
        positionInSession: 6,
        weeklySetsForMuscle: 30,
      },
    );
    expect(extremo.sets).toBeGreaterThanOrEqual(2);
    expect(extremo.rir).toBeLessThanOrEqual(4);
    expect(extremo.restSeconds).toBeLessThanOrEqual(300);
  });
});

describe("formatPrescription", () => {
  it("resume el esquema en una linea", () => {
    const text = formatPrescription(
      recommendPrescription(sentadilla, {
        goal: "hipertrofia",
        experience: "intermedio",
      }),
    );
    expect(text).toMatch(/^\d x \d+-\d+ · RIR \d · \d+s$/);
  });
});

describe("BIO-003 · el fallo no importa igual para fuerza que para hipertrofia", () => {
  const ctx = { experience: "intermedio" } as const;

  /**
   * Robinson 2024: relacion insignificante entre proximidad al fallo y
   * ganancias de fuerza (los intervalos contienen el nulo), pero la
   * hipertrofia si mejora al acercarse. Antes se prescribia casi lo mismo
   * para ambos, que era justo al reves.
   */
  it("fuerza deja mas margen al fallo que hipertrofia", () => {
    const fuerza = recommendPrescription(sentadilla, {
      ...ctx,
      goal: "fuerza",
    });
    const hipertrofia = recommendPrescription(sentadilla, {
      ...ctx,
      goal: "hipertrofia",
    });

    expect(fuerza.rir).toBeGreaterThan(hipertrofia.rir);
  });

  it("en aislados de hipertrofia se llega mas cerca del fallo", () => {
    const aislado = recommendPrescription(curl, {
      ...ctx,
      goal: "hipertrofia",
    });
    const compuesto = recommendPrescription(sentadilla, {
      ...ctx,
      goal: "hipertrofia",
    });

    // Fallar en un aislado cuesta menos fatiga y menos riesgo.
    expect(aislado.rir).toBeLessThanOrEqual(compuesto.rir);
  });
});

describe("BIO-007 · suelo de descanso", () => {
  const ctx = { experience: "intermedio" } as const;

  it("ninguna prescripcion baja de 60 segundos", () => {
    const objetivos = [
      "fuerza",
      "hipertrofia",
      "recomposicion",
      "resistencia",
    ] as const;

    for (const goal of objetivos) {
      for (const ejercicio of [sentadilla, curl]) {
        expect(
          recommendPrescription(ejercicio, { ...ctx, goal }).restSeconds,
        ).toBeGreaterThanOrEqual(60);
      }
    }
  });

  /**
   * El objetivo "resistencia" acortaba el descanso a 60 y 75 s porque
   * resistencia suena a poco descanso, no porque mejore nada. 07A ya advertia
   * de no imponer descansos cortos por sensacion de intensidad.
   */
  it("resistencia ya no acorta el descanso por debajo de la referencia", () => {
    expect(
      recommendPrescription(curl, { ...ctx, goal: "resistencia" }).restSeconds,
    ).toBeGreaterThanOrEqual(90);
  });
});
