import { describe, expect, it } from "vitest";
import {
  rateExercise,
  type BiomechanicalExercise,
  type RatingContext,
} from "@/features/training/lib/biomechanics";
import {
  compareExercises,
  rankComparisons,
} from "@/features/training/lib/exercise-comparison";

const exercise = (
  overrides: Partial<BiomechanicalExercise> = {},
): BiomechanicalExercise => ({
  id: "1",
  name: "Sentadilla con barra",
  primaryMuscle: "cuadriceps",
  secondaryMuscles: ["gluteos", "isquiotibiales"],
  movementPattern: "sentadilla",
  equipment: "barra",
  difficulty: "intermedio",
  joints: ["cadera", "rodilla", "tobillo"],
  resistanceProfile: "ascendente",
  hardestPoint: "Salida del punto mas profundo.",
  stability: 4,
  rangeOfMotion: 9,
  technicalDemand: 7,
  systemicFatigue: 9,
  progressionEase: 8,
  isUnilateral: false,
  commonErrors: [],
  techniqueCues: [],
  ...overrides,
});

const context = (overrides: Partial<RatingContext> = {}): RatingContext => ({
  goal: "hipertrofia",
  experience: "intermedio",
  ...overrides,
});

describe("rateExercise", () => {
  it("cada valoracion trae siempre un motivo", () => {
    const ratings = rateExercise(exercise(), context());
    expect(ratings).toHaveLength(6);
    for (const rating of ratings) {
      expect(rating.reason.length).toBeGreaterThan(10);
      expect(rating.score).toBeGreaterThanOrEqual(1);
      expect(rating.score).toBeLessThanOrEqual(10);
    }
  });

  it("penaliza la inestabilidad a un principiante y la perdona a un avanzado", () => {
    const inestable = exercise({ stability: 3 });
    const novato = rateExercise(inestable, context({ experience: "principiante" }));
    const avanzado = rateExercise(inestable, context({ experience: "avanzado" }));

    const novatoScore = novato.find((r) => r.dimension === "estabilidad")!;
    const avanzadoScore = avanzado.find((r) => r.dimension === "estabilidad")!;

    expect(novatoScore.score).toBeLessThan(avanzadoScore.score);
    expect(novatoScore.reason).toContain("estabilizar");
  });

  it("avisa al principiante cuando la tecnica es exigente", () => {
    const ratings = rateExercise(
      exercise({ technicalDemand: 9 }),
      context({ experience: "principiante" }),
    );
    const tecnica = ratings.find((r) => r.dimension === "demandaTecnica")!;
    expect(tecnica.reason).toContain("supervision");
    expect(tecnica.score).toBeLessThanOrEqual(3);
  });

  it("valora distinto el mismo ejercicio segun el objetivo", () => {
    const maquina = exercise({
      stability: 9,
      progressionEase: 5,
      rangeOfMotion: 7,
      systemicFatigue: 3,
    });
    const fuerza = rateExercise(maquina, context({ goal: "fuerza" }));
    const resistencia = rateExercise(maquina, context({ goal: "resistencia" }));

    const fuerzaFit = fuerza.find((r) => r.dimension === "objetivo")!;
    const resistenciaFit = resistencia.find((r) => r.dimension === "objetivo")!;
    // Una maquina muy estable pero dificil de progresar sirve mas para
    // resistencia que para fuerza.
    expect(resistenciaFit.score).toBeGreaterThan(fuerzaFit.score);
    expect(fuerzaFit.reason).not.toBe(resistenciaFit.reason);
  });

  it("penaliza un ejercicio muy fatigante colocado al final de la sesion", () => {
    const alInicio = rateExercise(exercise(), context({ positionInSession: 1 }));
    const alFinal = rateExercise(exercise(), context({ positionInSession: 5 }));

    const inicio = alInicio.find((r) => r.dimension === "fatiga")!;
    const final = alFinal.find((r) => r.dimension === "fatiga")!;

    expect(final.score).toBeLessThan(inicio.score);
    expect(final.reason).toContain("posicion 5");
  });

  it("usa un valor prudente cuando faltan datos del catalogo", () => {
    const sinDatos = exercise({
      stability: null,
      rangeOfMotion: null,
      technicalDemand: null,
      systemicFatigue: null,
      progressionEase: null,
    });
    const ratings = rateExercise(sinDatos, context());
    for (const rating of ratings) {
      expect(rating.score).toBeGreaterThanOrEqual(1);
      expect(rating.score).toBeLessThanOrEqual(10);
    }
  });
});

describe("compareExercises", () => {
  const prensa = exercise({
    id: "2",
    name: "Prensa de pierna",
    primaryMuscle: "cuadriceps",
    secondaryMuscles: ["gluteos"],
    movementPattern: "sentadilla",
    equipment: "maquina",
    joints: ["cadera", "rodilla"],
    resistanceProfile: "constante",
    stability: 9,
    rangeOfMotion: 7,
    technicalDemand: 3,
    systemicFatigue: 5,
    progressionEase: 9,
  });

  it("reconoce musculo y patron compartidos", () => {
    const result = compareExercises(exercise(), prensa);
    expect(result.similarities.some((s) => s.includes("cuadriceps"))).toBe(true);
    expect(result.similarities.some((s) => s.includes("sentadilla"))).toBe(true);
    expect(result.compatibility).toBeGreaterThan(6);
  });

  it("explica que se gana y que se pierde", () => {
    const result = compareExercises(exercise(), prensa);
    // La prensa es mas estable y mas facil de progresar.
    expect(result.advantages.some((a) => a.startsWith("Estabilidad"))).toBe(true);
    // Pero recorta rango frente a la sentadilla.
    expect(result.limitations.some((l) => l.startsWith("Rango"))).toBe(true);
    expect(result.differences.some((d) => d.includes("equipo"))).toBe(true);
  });

  it("nunca presenta dos ejercicios como identicos", () => {
    const result = compareExercises(exercise(), prensa);
    expect(result.compatibility).toBeLessThan(10);
    expect(result.recommendation.length).toBeGreaterThan(10);
  });

  it("advierte cuando el musculo principal cambia", () => {
    const curl = exercise({
      id: "3",
      name: "Curl de biceps",
      primaryMuscle: "biceps",
      movementPattern: "flexion de codo",
      joints: ["codo"],
    });
    const result = compareExercises(exercise(), curl);
    expect(result.recommendation).toContain("no sustituye");
    expect(result.differences.some((d) => d.includes("musculo principal"))).toBe(
      true,
    );
  });

  it("distingue unilateral de bilateral", () => {
    const zancadas = exercise({
      id: "4",
      name: "Zancadas",
      isUnilateral: true,
      equipment: "mancuernas",
    });
    const result = compareExercises(exercise(), zancadas);
    expect(result.differences.some((d) => d.includes("unilateral"))).toBe(true);
  });
});

describe("rankComparisons", () => {
  it("ordena por compatibilidad y excluye el propio ejercicio", () => {
    const source = exercise();
    const prensa = exercise({
      id: "2",
      name: "Prensa",
      primaryMuscle: "cuadriceps",
      movementPattern: "sentadilla",
      joints: ["cadera", "rodilla"],
    });
    const curl = exercise({
      id: "3",
      name: "Curl",
      primaryMuscle: "biceps",
      movementPattern: "flexion de codo",
      joints: ["codo"],
    });

    const results = rankComparisons(source, [source, curl, prensa]);
    expect(results).toHaveLength(2);
    expect(results[0]!.exercise.id).toBe("2");
    expect(results[0]!.compatibility).toBeGreaterThan(
      results[1]!.compatibility,
    );
  });
});
