import { describe, expect, it } from "vitest";
import {
  pickCandidates,
  questionnaireSchema,
  validateGenerated,
  type GeneratedRoutine,
} from "./routine-generation";

const c = (
  id: string,
  primaryMuscle: string,
  equipment: string | null,
  difficulty: string | null = null,
) => ({
  id,
  name: id,
  primaryMuscle,
  secondaryMuscles: [],
  equipment,
  difficulty,
});

describe("questionnaireSchema", () => {
  it("sólo acepta de 3 a 6 días", () => {
    const base = {
      goal: "hipertrofia",
      level: "intermedio",
      equipment: ["gimnasio"],
      emphasis: [],
    };
    expect(
      questionnaireSchema.safeParse({ ...base, daysPerWeek: 2 }).success,
    ).toBe(false);
    expect(
      questionnaireSchema.safeParse({ ...base, daysPerWeek: 7 }).success,
    ).toBe(false);
    expect(
      questionnaireSchema.safeParse({ ...base, daysPerWeek: 4 }).success,
    ).toBe(true);
  });
});

describe("pickCandidates", () => {
  it("respeta el equipo, deja el peso corporal y quita lo avanzado al principiante", () => {
    const picked = pickCandidates(
      [
        c("press-barra", "pecho", "barra"),
        c("press-manc", "pecho", "mancuernas"),
        c("flexiones", "pecho", "peso corporal"),
        c("muscle-up", "espalda", "peso corporal", "avanzado"),
      ],
      { equipment: ["mancuernas"], level: "principiante" },
    );
    expect(picked.map((x) => x.id)).toEqual(["press-manc", "flexiones"]);
  });
});

describe("validateGenerated", () => {
  const refs = new Map([
    ["e1", "id-1"],
    ["e2", "id-2"],
    ["e3", "id-3"],
  ]);
  const day = (exercises: GeneratedRoutine["days"][number]["exercises"]) => ({
    focus: "Pierna",
    exercises,
  });
  const ex = (
    ref: string,
    over: Partial<GeneratedRoutine["days"][number]["exercises"][number]> = {},
  ) => ({
    ref,
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    rir: 2,
    restSeconds: 120,
    notes: null,
    ...over,
  });

  it("descarta ids inventados y repetidos, y recorta los números", () => {
    const out = validateGenerated(
      {
        name: "Prueba",
        notes: "",
        days: [
          day([
            ex("e1", { sets: 12, restSeconds: 20 }),
            ex("e1"),
            ex("inventado"),
            ex("e2", { repsMin: 12, repsMax: 6 }),
            ex("e3", { rir: 7 }),
          ]),
        ],
      },
      refs,
      1,
    );
    expect(out?.days[0]?.exercises.map((e) => e.exerciseId)).toEqual([
      "id-1",
      "id-2",
      "id-3",
    ]);
    expect(out?.days[0]?.exercises[0]).toMatchObject({
      sets: 6,
      restSeconds: 60,
    });
    expect(out?.days[0]?.exercises[1]).toMatchObject({
      repsMin: 12,
      repsMax: 12,
    });
    expect(out?.days[0]?.exercises[2]?.rir).toBe(4);
  });

  it("rechaza si no salen los días pedidos", () => {
    const out = validateGenerated(
      { name: "x", notes: "", days: [day([ex("e1"), ex("e2"), ex("e3")])] },
      refs,
      3,
    );
    expect(out).toBeNull();
  });
});
