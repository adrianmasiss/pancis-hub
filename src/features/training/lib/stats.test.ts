import { describe, expect, it } from "vitest";
import {
  effectiveSetCount,
  muscleFrequency,
  personalRecords,
  sessionVolume,
  type LoggedSet,
} from "./stats";
import { rankExerciseAlternatives, type CatalogExercise } from "./alternatives";

const sets: LoggedSet[] = [
  {
    exerciseId: "squat",
    exerciseName: "Sentadilla",
    primaryMuscle: "cuadriceps",
    isWarmup: true,
    weightKg: 40,
    repetitions: 8,
  },
  {
    exerciseId: "squat",
    exerciseName: "Sentadilla",
    primaryMuscle: "cuadriceps",
    isWarmup: false,
    weightKg: 60,
    repetitions: 8,
  },
  {
    exerciseId: "squat",
    exerciseName: "Sentadilla",
    primaryMuscle: "cuadriceps",
    isWarmup: false,
    weightKg: 60,
    repetitions: 7,
  },
  {
    exerciseId: "press",
    exerciseName: "Press banca",
    primaryMuscle: "pecho",
    isWarmup: false,
    weightKg: 35,
    repetitions: 10,
  },
];

describe("sessionVolume", () => {
  it("suma peso x reps excluyendo calentamientos", () => {
    // 60*8 + 60*7 + 35*10 = 480 + 420 + 350 = 1250
    expect(sessionVolume(sets)).toBe(1250);
  });

  it("tolera series sin peso o reps", () => {
    expect(
      sessionVolume([
        { exerciseId: "x", isWarmup: false, weightKg: null, repetitions: 10 },
      ]),
    ).toBe(0);
  });
});

describe("effectiveSetCount", () => {
  it("no cuenta calentamientos", () => {
    expect(effectiveSetCount(sets)).toBe(3);
  });
});

describe("personalRecords", () => {
  it("elige la serie mas pesada por ejercicio", () => {
    const records = personalRecords(sets);
    expect(records[0]).toMatchObject({ exerciseId: "squat", weightKg: 60 });
  });

  it("a igual peso gana la de mas repeticiones", () => {
    const records = personalRecords(sets);
    expect(records.find((r) => r.exerciseId === "squat")?.repetitions).toBe(8);
  });

  it("ignora calentamientos", () => {
    const warmupOnly = personalRecords([
      { exerciseId: "x", isWarmup: true, weightKg: 100, repetitions: 5 },
    ]);
    expect(warmupOnly).toHaveLength(0);
  });
});

describe("muscleFrequency", () => {
  it("cuenta series efectivas por musculo, ordenado descendente", () => {
    const frequency = muscleFrequency(sets);
    expect([...frequency.entries()]).toEqual([
      ["cuadriceps", 2],
      ["pecho", 1],
    ]);
  });
});

const squat: CatalogExercise = {
  id: "squat",
  name: "Sentadilla con barra",
  primaryMuscle: "cuadriceps",
  secondaryMuscles: ["gluteos", "isquiotibiales", "core"],
  movementPattern: "sentadilla",
  equipment: "barra",
  difficulty: "intermedio",
};

const legPress: CatalogExercise = {
  id: "leg-press",
  name: "Prensa de pierna",
  primaryMuscle: "cuadriceps",
  secondaryMuscles: ["gluteos"],
  movementPattern: "sentadilla",
  equipment: "maquina",
  difficulty: "principiante",
};

const deadlift: CatalogExercise = {
  id: "deadlift",
  name: "Peso muerto",
  primaryMuscle: "isquiotibiales",
  secondaryMuscles: ["gluteos", "espalda baja"],
  movementPattern: "bisagra de cadera",
  equipment: "barra",
  difficulty: "intermedio",
};

describe("rankExerciseAlternatives", () => {
  it("prioriza mismo musculo principal y patron", () => {
    const results = rankExerciseAlternatives(squat, [deadlift, legPress]);
    expect(results[0]?.exercise.id).toBe("leg-press");
    expect(results[0]?.samePrimaryMuscle).toBe(true);
  });

  it("filtra por equipo disponible cuando se indica", () => {
    const results = rankExerciseAlternatives(squat, [deadlift, legPress], {
      equipment: "maquina",
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.exercise.id).toBe("leg-press");
  });

  it("excluye el propio ejercicio", () => {
    const results = rankExerciseAlternatives(squat, [squat, legPress]);
    expect(results.some((r) => r.exercise.id === "squat")).toBe(false);
  });
});
