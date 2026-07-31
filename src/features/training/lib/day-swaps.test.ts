import { describe, expect, it } from "vitest";
import {
  applyExerciseDaySwaps,
  hasSwapForDate,
  type ExerciseDaySwapRecord,
  type SwappableExercise,
} from "./day-swaps";

const HOY = "2026-07-28";
const AYER = "2026-07-27";

// Dia de empuje tal como lo guarda el plan.
const PLAN: SwappableExercise[] = [
  {
    id: "pe-1",
    exerciseId: "ex-press-banca",
    name: "Press de banca con barra",
    primaryMuscle: "pectoral",
    equipment: "barra",
  },
  {
    id: "pe-2",
    exerciseId: "ex-press-militar",
    name: "Press militar",
    primaryMuscle: "deltoides",
    equipment: "barra",
  },
];

const swapMancuernas = (date: string): ExerciseDaySwapRecord => ({
  planExerciseId: "pe-1",
  date,
  substituteExerciseId: "ex-press-mancuernas",
  substituteName: "Press de banca con mancuernas",
  substitutePrimaryMuscle: "pectoral",
  substituteEquipment: "mancuernas",
  reason: "La banca con barra estaba ocupada",
  source: "usuario",
});

describe("applyExerciseDaySwaps", () => {
  it("sin sustituciones devuelve el plan intacto", () => {
    const view = applyExerciseDaySwaps(PLAN, [], HOY);

    expect(view).toHaveLength(2);
    expect(view.map((exercise) => exercise.name)).toEqual([
      "Press de banca con barra",
      "Press militar",
    ]);
    expect(view.every((exercise) => exercise.daySwap === null)).toBe(true);
  });

  it("sustituye solo el ejercicio afectado y conserva el original a la vista", () => {
    const view = applyExerciseDaySwaps(PLAN, [swapMancuernas(HOY)], HOY);

    expect(view[0]!.name).toBe("Press de banca con mancuernas");
    expect(view[0]!.exerciseId).toBe("ex-press-mancuernas");
    expect(view[0]!.equipment).toBe("mancuernas");
    expect(view[0]!.daySwap).toEqual({
      exerciseId: "ex-press-banca",
      name: "Press de banca con barra",
      primaryMuscle: "pectoral",
      equipment: "barra",
      reason: "La banca con barra estaba ocupada",
      source: "usuario",
    });

    // El resto del dia no se toca.
    expect(view[1]!.name).toBe("Press militar");
    expect(view[1]!.daySwap).toBeNull();
  });

  it("una sustitucion de ayer no aplica hoy", () => {
    const view = applyExerciseDaySwaps(PLAN, [swapMancuernas(AYER)], HOY);

    expect(view[0]!.name).toBe("Press de banca con barra");
    expect(view[0]!.daySwap).toBeNull();
  });

  it("consultar la fecha de la sustitucion la muestra de nuevo", () => {
    const view = applyExerciseDaySwaps(PLAN, [swapMancuernas(AYER)], AYER);

    expect(view[0]!.name).toBe("Press de banca con mancuernas");
  });

  it("ignora una sustitucion por el mismo ejercicio", () => {
    const view = applyExerciseDaySwaps(
      PLAN,
      [
        {
          ...swapMancuernas(HOY),
          substituteExerciseId: "ex-press-banca",
          substituteName: "Press de banca con barra",
        },
      ],
      HOY,
    );

    expect(view[0]!.daySwap).toBeNull();
    expect(view[0]!.name).toBe("Press de banca con barra");
  });

  it("no muta el plan recibido, por muchas sustituciones que se apliquen", () => {
    const original = structuredClone(PLAN);

    let acumulado: readonly SwappableExercise[] = PLAN;
    for (let i = 0; i < 25; i += 1) {
      acumulado = applyExerciseDaySwaps(
        acumulado,
        [{ ...swapMancuernas(HOY), substituteExerciseId: `ex-${i}` }],
        HOY,
      );
    }

    // La invariante del producto: el plan base es intocable.
    expect(PLAN).toEqual(original);
  });

  it("aplica sustituciones a varios ejercicios del mismo dia", () => {
    const view = applyExerciseDaySwaps(
      PLAN,
      [
        swapMancuernas(HOY),
        {
          planExerciseId: "pe-2",
          date: HOY,
          substituteExerciseId: "ex-press-arnold",
          substituteName: "Press Arnold",
          substitutePrimaryMuscle: "deltoides",
          substituteEquipment: "mancuernas",
          reason: null,
          source: "asistente",
        },
      ],
      HOY,
    );

    expect(view.map((exercise) => exercise.name)).toEqual([
      "Press de banca con mancuernas",
      "Press Arnold",
    ]);
    expect(view[1]!.daySwap?.source).toBe("asistente");
  });
});

describe("hasSwapForDate", () => {
  it("distingue por ejercicio y por fecha", () => {
    const swaps = [swapMancuernas(HOY)];

    expect(hasSwapForDate(swaps, "pe-1", HOY)).toBe(true);
    expect(hasSwapForDate(swaps, "pe-1", AYER)).toBe(false);
    expect(hasSwapForDate(swaps, "pe-2", HOY)).toBe(false);
  });
});
