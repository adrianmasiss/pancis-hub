import { describe, expect, it } from "vitest";
import {
  effectiveSetCount,
  muscleFrequency,
  personalRecords,
  sessionVolume,
  type LoggedSet,
} from "./stats";

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
