import { describe, expect, it } from "vitest";
import {
  effectiveSetCount,
  estimatedMinutes,
  exerciseHistory,
  latestRecord,
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

describe("exerciseHistory", () => {
  const set = (
    day: string,
    weightKg: number,
    repetitions = 8,
    isWarmup = false,
  ) => ({
    exerciseId: "banca",
    isWarmup,
    weightKg,
    repetitions,
    createdAt: `${day}T10:00:00Z`,
  });
  it("toma la serie más pesada de cada día y separa la última de la anterior", () => {
    const h = exerciseHistory([
      set("2026-10-01", 75),
      set("2026-10-01", 77.5),
      set("2026-10-08", 80, 6),
      set("2026-10-08", 60, 10, true),
    ]).get("banca")!;
    expect(h.last).toEqual({
      weightKg: 80,
      repetitions: 6,
      date: "2026-10-08",
    });
    expect(h.previous).toEqual({
      weightKg: 77.5,
      repetitions: 8,
      date: "2026-10-01",
    });
  });
});

describe("latestRecord", () => {
  it("la primera vez no es marca; la siguiente que supera sí", () => {
    const base = {
      exerciseName: "Press banca",
      isWarmup: false,
      repetitions: 8,
    };
    expect(
      latestRecord([
        { ...base, exerciseId: "b", weightKg: 80, createdAt: "2026-10-01" },
      ]),
    ).toBeNull();
    const r = latestRecord([
      { ...base, exerciseId: "b", weightKg: 80, createdAt: "2026-10-01" },
      { ...base, exerciseId: "b", weightKg: 82.5, createdAt: "2026-10-08" },
      { ...base, exerciseId: "b", weightKg: 82.5, createdAt: "2026-10-10" },
    ]);
    expect(r).toMatchObject({
      weightKg: 82.5,
      deltaKg: 2.5,
      date: "2026-10-08",
    });
  });
});

describe("estimatedMinutes", () => {
  it("cuenta trabajo, descansos entre series y el cambio de ejercicio", () => {
    // 4 series × 45 s + 3 descansos × 120 s + 60 s = 600 s
    expect(estimatedMinutes([{ sets: 4, restSeconds: 120 }])).toBe(10);
    expect(estimatedMinutes([{ sets: null, restSeconds: null }])).toBe(0);
  });
});
