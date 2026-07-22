import { describe, expect, it } from "vitest";
import {
  parseRoutineText,
  summarizeRoutine,
} from "@/features/training/lib/routine-parser";

describe("parseRoutineText", () => {
  it("interpreta una rutina tipica de mensaje", () => {
    const routine = parseRoutineText(`
Dia 1 - Pierna
Sentadilla 4x8-10 RIR 2 desc 120
Prensa de pierna 3 x 12
Curl femoral 3x15

Dia 2 - Torso
Press de banca 4x6-8 RIR 1 descanso 180
    `);

    expect(routine.days).toHaveLength(2);
    expect(routine.days[0]!.name).toBe("Dia 1 - Pierna");
    expect(routine.days[0]!.exercises).toHaveLength(3);

    const sentadilla = routine.days[0]!.exercises[0]!;
    expect(sentadilla.rawName).toBe("Sentadilla");
    expect(sentadilla.sets).toBe(4);
    expect(sentadilla.repsMin).toBe(8);
    expect(sentadilla.repsMax).toBe(10);
    expect(sentadilla.rir).toBe(2);
    expect(sentadilla.restSeconds).toBe(120);
  });

  it("acepta un rango de repeticiones ausente", () => {
    const routine = parseRoutineText("Prensa 3x12");
    const prensa = routine.days[0]!.exercises[0]!;
    expect(prensa.repsMin).toBe(12);
    expect(prensa.repsMax).toBe(12);
  });

  it("entiende el descanso en minutos", () => {
    const routine = parseRoutineText("Peso muerto 3x5 rest 3min");
    expect(routine.days[0]!.exercises[0]!.restSeconds).toBe(180);
  });

  it("reconoce RPE ademas de RIR", () => {
    const routine = parseRoutineText("Remo 4x10 @RPE 8");
    const remo = routine.days[0]!.exercises[0]!;
    expect(remo.rpe).toBe(8);
    expect(remo.rir).toBeNull();
  });

  it("limpia vinetas y numeracion del nombre", () => {
    const routine = parseRoutineText(`
- Sentadilla 4x8
1) Press militar 3x10
• Curl de biceps 3x12
    `);
    expect(routine.days[0]!.exercises.map((e) => e.rawName)).toEqual([
      "Sentadilla",
      "Press militar",
      "Curl de biceps",
    ]);
  });

  it("reconoce dias por nombre de la semana", () => {
    const routine = parseRoutineText(`
Lunes - Empuje
Press de banca 4x8
    `);
    expect(routine.days[0]!.name).toBe("Lunes - Empuje");
  });

  it("asigna a un dia implicito los ejercicios sin encabezado", () => {
    // Es comun que la rutina empiece directo con la lista.
    const routine = parseRoutineText("Sentadilla 4x8\nPrensa 3x12");
    expect(routine.days).toHaveLength(1);
    expect(routine.days[0]!.name).toBe("Dia 1");
    expect(routine.days[0]!.exercises).toHaveLength(2);
  });

  it("guarda las lineas que no pudo interpretar en vez de descartarlas", () => {
    const routine = parseRoutineText(`
Dia 1
Sentadilla 4x8
ok
    `);
    expect(routine.ignoredLines).toEqual(["ok"]);
  });

  it("descarta los dias que quedaron sin ejercicios", () => {
    const routine = parseRoutineText("Dia 1 - Descanso\n\nDia 2\nRemo 4x10");
    expect(routine.days).toHaveLength(1);
    expect(routine.days[0]!.name).toBe("Dia 2");
  });

  it("acepta un ejercicio sin prescripcion", () => {
    const routine = parseRoutineText("Dia 1\nPlancha");
    const plancha = routine.days[0]!.exercises[0]!;
    expect(plancha.rawName).toBe("Plancha");
    expect(plancha.sets).toBeNull();
    expect(plancha.repsMin).toBeNull();
  });

  it("no produce dias con un texto vacio", () => {
    expect(parseRoutineText("   \n\n  ").days).toHaveLength(0);
  });
});

describe("summarizeRoutine", () => {
  it("cuenta dias y ejercicios", () => {
    const routine = parseRoutineText(
      "Dia 1\nSentadilla 4x8\nPrensa 3x12\nDia 2\nRemo 4x10",
    );
    expect(summarizeRoutine(routine)).toEqual({
      dayCount: 2,
      exerciseCount: 3,
    });
  });
});
