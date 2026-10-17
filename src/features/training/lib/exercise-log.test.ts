import { describe, expect, it } from "vitest";
import { buildExerciseLog, searchExerciseLog } from "./exercise-log";

const set = (weightKg: number, repetitions: number, isWarmup = false) => ({
  exerciseId: "banca",
  exerciseName: "Press de banca",
  primaryMuscle: "pecho",
  equipment: "barra",
  isWarmup,
  weightKg,
  repetitions,
});

const log = buildExerciseLog([
  {
    id: "s1",
    startedAt: "2026-10-01T10:00:00Z",
    sets: [set(40, 10, true), set(75, 8), set(77.5, 6)],
  },
  {
    id: "s2",
    startedAt: "2026-10-08T10:00:00Z",
    sets: [set(80, 8), set(80, 7)],
  },
]);

describe("buildExerciseLog", () => {
  it("agrupa por ejercicio y por sesión, de lo reciente a lo antiguo", () => {
    expect(log).toHaveLength(1);
    expect(log[0]!.days.map((d) => d.sessionId)).toEqual(["s2", "s1"]);
    expect(log[0]!.days[1]!.sets).toHaveLength(3);
  });
  it("la mejor marca ignora calentamientos y gana más repeticiones a igual peso", () => {
    expect(log[0]!.best).toEqual({
      weightKg: 80,
      repetitions: 8,
      date: "2026-10-08T10:00:00Z",
    });
    expect(log[0]!.effectiveSets).toBe(4);
  });
});

describe("searchExerciseLog", () => {
  it("encuentra sin tildes ni mayúsculas, también por músculo", () => {
    expect(searchExerciseLog(log, "BANCA")).toHaveLength(1);
    expect(searchExerciseLog(log, "pécho")).toHaveLength(1);
    expect(searchExerciseLog(log, "sentadilla")).toHaveLength(0);
  });
});
