import { describe, expect, it } from "vitest";
import {
  analyzeRoutine,
  type RoutineDay,
  type RoutineExercise,
} from "@/features/training/lib/routine-analysis";

const exercise = (
  overrides: Partial<RoutineExercise> & { name: string },
): RoutineExercise => ({
  primaryMuscle: "cuadriceps",
  secondaryMuscles: [],
  movementPattern: "sentadilla",
  position: 1,
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  rir: 2,
  systemicFatigue: 5,
  ...overrides,
});

/**
 * Torso/pierna repetido dos veces por semana: cubre los seis patrones
 * principales y deja a cada musculo entre 6 y 14 series semanales, que es
 * un rango razonable. Sirve como caso de "nada que corregir".
 */
const lowerDay = (dayIndex: number): RoutineDay => ({
  name: `Tren inferior ${dayIndex}`,
  dayIndex,
  exercises: [
    exercise({
      name: "Sentadilla",
      movementPattern: "sentadilla",
      position: 1,
      sets: 4,
    }),
    exercise({
      name: "Peso muerto rumano",
      primaryMuscle: "isquiotibiales",
      movementPattern: "bisagra de cadera",
      position: 2,
      sets: 3,
    }),
    exercise({
      name: "Prensa",
      movementPattern: "sentadilla",
      position: 3,
      sets: 3,
    }),
  ],
});

const upperDay = (dayIndex: number): RoutineDay => ({
  name: `Tren superior ${dayIndex}`,
  dayIndex,
  exercises: [
    exercise({
      name: "Press de banca",
      primaryMuscle: "pecho",
      movementPattern: "empuje horizontal",
      position: 1,
      sets: 4,
    }),
    exercise({
      name: "Remo",
      primaryMuscle: "espalda",
      movementPattern: "traccion horizontal",
      position: 2,
      sets: 4,
    }),
    exercise({
      name: "Press militar",
      primaryMuscle: "hombros",
      movementPattern: "empuje vertical",
      position: 3,
      sets: 3,
    }),
    exercise({
      name: "Jalon",
      primaryMuscle: "espalda",
      movementPattern: "traccion vertical",
      position: 4,
      sets: 3,
    }),
  ],
});

const balancedRoutine: RoutineDay[] = [
  lowerDay(1),
  upperDay(2),
  lowerDay(3),
  upperDay(4),
];

describe("analyzeRoutine", () => {
  it("informa cuando la rutina esta vacia", () => {
    const result = analyzeRoutine([]);
    expect(result.findings[0]!.title).toBe("Rutina vacia");
    expect(result.missingPatterns.length).toBeGreaterThan(0);
  });

  it("cuenta volumen semanal contando los secundarios a mitad", () => {
    const result = analyzeRoutine([
      {
        name: "Dia 1",
        dayIndex: 1,
        exercises: [
          exercise({
            name: "Sentadilla",
            primaryMuscle: "cuadriceps",
            secondaryMuscles: ["gluteos"],
            sets: 4,
          }),
        ],
      },
    ]);

    const cuadriceps = result.weeklySetsByMuscle.find(
      (entry) => entry.muscle === "cuadriceps",
    );
    const gluteos = result.weeklySetsByMuscle.find(
      (entry) => entry.muscle === "gluteos",
    );
    expect(cuadriceps!.sets).toBe(4);
    expect(gluteos!.sets).toBe(2);
  });

  it("cuenta la frecuencia semanal por musculo", () => {
    const result = analyzeRoutine(balancedRoutine);
    const espalda = result.frequencyByMuscle.find(
      (entry) => entry.muscle === "espalda",
    );
    // Espalda aparece dos veces por dia de torso, pero en 2 dias: frecuencia 2.
    expect(espalda!.days).toBe(2);
  });

  it("marca como prioridad alta los ejercicios sin series", () => {
    const result = analyzeRoutine([
      {
        name: "Dia 1",
        dayIndex: 1,
        exercises: [exercise({ name: "Sentadilla", sets: null })],
      },
    ]);
    const finding = result.findings[0]!;
    expect(finding.priority).toBe("alta");
    expect(finding.detail).toContain("Sentadilla");
  });

  it("detecta patrones de movimiento ausentes", () => {
    const result = analyzeRoutine([
      {
        name: "Solo piernas",
        dayIndex: 1,
        exercises: [exercise({ name: "Sentadilla" })],
      },
    ]);
    expect(result.missingPatterns).toContain("empuje horizontal");
    expect(
      result.findings.some((f) => f.title.includes("Patrones de movimiento")),
    ).toBe(true);
  });

  it("avisa de volumen semanal excesivo", () => {
    const result = analyzeRoutine([
      {
        name: "Dia 1",
        dayIndex: 1,
        exercises: [exercise({ name: "Sentadilla", sets: 20 })],
      },
      {
        name: "Dia 2",
        dayIndex: 2,
        exercises: [exercise({ name: "Prensa", sets: 8 })],
      },
    ]);
    expect(
      result.findings.some((f) => f.title.includes("Volumen alto")),
    ).toBe(true);
  });

  it("senala redundancia cuando se repite un patron el mismo dia", () => {
    const result = analyzeRoutine([
      {
        name: "Dia 1",
        dayIndex: 1,
        exercises: [
          exercise({ name: "Sentadilla", position: 1 }),
          exercise({ name: "Prensa", position: 2 }),
          exercise({ name: "Hack", position: 3 }),
        ],
      },
    ]);
    expect(
      result.findings.some((f) => f.title.includes("Patron repetido")),
    ).toBe(true);
  });

  it("detecta un ejercicio muy fatigante colocado al final", () => {
    const result = analyzeRoutine([
      {
        name: "Dia 1",
        dayIndex: 1,
        exercises: [
          exercise({ name: "Elevaciones", position: 1, systemicFatigue: 2 }),
          exercise({ name: "Curl", position: 2, systemicFatigue: 2 }),
          exercise({ name: "Extension", position: 3, systemicFatigue: 3 }),
          exercise({ name: "Peso muerto", position: 4, systemicFatigue: 10 }),
        ],
      },
    ]);
    const finding = result.findings.find((f) =>
      f.title.includes("Orden mejorable"),
    );
    expect(finding).toBeDefined();
    expect(finding!.detail).toContain("Peso muerto");
  });

  it("ordena los hallazgos por prioridad", () => {
    const result = analyzeRoutine([
      {
        name: "Dia 1",
        dayIndex: 1,
        exercises: [
          // Sin series (alta) y ademas faltan patrones (mejora).
          exercise({ name: "Sentadilla", sets: null }),
        ],
      },
    ]);
    expect(result.findings[0]!.priority).toBe("alta");
    expect(
      result.findings.findIndex((f) => f.priority === "mejora"),
    ).toBeGreaterThan(0);
  });

  it("dice explicitamente cuando no hay nada que corregir", () => {
    const result = analyzeRoutine(balancedRoutine);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.priority).toBe("sin_cambios");
  });
});
