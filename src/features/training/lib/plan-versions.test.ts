import { describe, expect, it } from "vitest";
import {
  diffPlanSnapshots,
  isIdenticalPlanSnapshot,
  snapshotExerciseCount,
  snapshotTotalSets,
  type PlanSnapshot,
  type VersionPlanExercise,
} from "@/features/training/lib/plan-versions";

const exercise = (
  exerciseId: string,
  exerciseName: string,
  overrides: Partial<VersionPlanExercise> = {},
): VersionPlanExercise => ({
  exerciseId,
  exerciseName,
  position: 1,
  sets: 4,
  repsMin: 8,
  repsMax: 12,
  rir: 2,
  rpe: null,
  tempo: null,
  restSeconds: 120,
  notes: null,
  ...overrides,
});

const base: PlanSnapshot = {
  name: "Torso/Pierna",
  objective: "hipertrofia",
  days: [
    {
      name: "Pierna",
      dayIndex: 1,
      exercises: [
        exercise("sq", "Sentadilla"),
        exercise("rdl", "Peso muerto rumano", { position: 2, sets: 3 }),
      ],
    },
    {
      name: "Torso",
      dayIndex: 2,
      exercises: [exercise("bp", "Press de banca")],
    },
  ],
};

describe("snapshotTotalSets", () => {
  it("suma las series planificadas de toda la rutina", () => {
    expect(snapshotTotalSets(base)).toBe(11);
  });

  it("ignora los ejercicios sin series definidas", () => {
    const sinSeries: PlanSnapshot = {
      ...base,
      days: [
        { ...base.days[0]!, exercises: [exercise("sq", "Sentadilla", { sets: null })] },
      ],
    };
    expect(snapshotTotalSets(sinSeries)).toBe(0);
  });
});

describe("snapshotExerciseCount", () => {
  it("cuenta los ejercicios de todos los dias", () => {
    expect(snapshotExerciseCount(base)).toBe(3);
  });
});

describe("diffPlanSnapshots", () => {
  it("detecta un cambio de series con el antes y el despues", () => {
    const current: PlanSnapshot = {
      ...base,
      days: [
        {
          ...base.days[0]!,
          exercises: [
            exercise("sq", "Sentadilla", { sets: 5 }),
            exercise("rdl", "Peso muerto rumano", { position: 2, sets: 3 }),
          ],
        },
        base.days[1]!,
      ],
    };

    const diff = diffPlanSnapshots(base, current);
    expect(diff.changedExercises).toEqual([
      {
        dayName: "Pierna",
        exerciseName: "Sentadilla",
        field: "series",
        from: "4",
        to: "5",
      },
    ]);
    expect(diff.setsDelta).toBe(1);
  });

  it("reporta varios campos cambiados del mismo ejercicio", () => {
    const current: PlanSnapshot = {
      ...base,
      days: [
        {
          ...base.days[0]!,
          exercises: [
            exercise("sq", "Sentadilla", { rir: 1, restSeconds: 180 }),
            exercise("rdl", "Peso muerto rumano", { position: 2, sets: 3 }),
          ],
        },
        base.days[1]!,
      ],
    };
    const campos = diffPlanSnapshots(base, current).changedExercises.map(
      (change) => change.field,
    );
    expect(campos).toContain("RIR");
    expect(campos).toContain("descanso");
  });

  it("detecta ejercicios agregados y quitados", () => {
    const current: PlanSnapshot = {
      ...base,
      days: [
        { ...base.days[0]!, exercises: [exercise("lp", "Prensa")] },
        base.days[1]!,
      ],
    };

    const diff = diffPlanSnapshots(base, current);
    expect(diff.addedExercises).toEqual([
      { dayName: "Pierna", exerciseName: "Prensa" },
    ]);
    expect(diff.removedExercises).toHaveLength(2);
  });

  it("detecta dias agregados y quitados", () => {
    const current: PlanSnapshot = {
      ...base,
      days: [
        base.days[0]!,
        { name: "Brazo", dayIndex: 3, exercises: [exercise("cu", "Curl")] },
      ],
    };

    const diff = diffPlanSnapshots(base, current);
    expect(diff.addedDays).toEqual(["Brazo"]);
    expect(diff.removedDays).toEqual(["Torso"]);
  });

  it("no reporta nada entre dos fotos iguales", () => {
    const diff = diffPlanSnapshots(base, base);
    expect(diff.changedExercises).toHaveLength(0);
    expect(diff.setsDelta).toBe(0);
  });

  it("muestra un guion cuando el valor pasa a estar vacio", () => {
    const current: PlanSnapshot = {
      ...base,
      days: [
        {
          ...base.days[0]!,
          exercises: [
            exercise("sq", "Sentadilla", { rir: null }),
            exercise("rdl", "Peso muerto rumano", { position: 2, sets: 3 }),
          ],
        },
        base.days[1]!,
      ],
    };
    const change = diffPlanSnapshots(base, current).changedExercises[0]!;
    expect(change.from).toBe("2");
    expect(change.to).toBe("—");
  });
});

describe("isIdenticalPlanSnapshot", () => {
  it("reconoce dos fotos iguales", () => {
    expect(isIdenticalPlanSnapshot(base, base)).toBe(true);
  });

  it("detecta el cambio de nombre o de objetivo", () => {
    expect(isIdenticalPlanSnapshot(base, { ...base, name: "Otra" })).toBe(false);
    expect(
      isIdenticalPlanSnapshot(base, { ...base, objective: "fuerza" }),
    ).toBe(false);
  });
});
