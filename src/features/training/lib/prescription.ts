/**
 * Recomendacion de series, repeticiones, RIR y descanso
 * (docs/02_PRODUCT_REQUIREMENTS.md 13).
 *
 * El requisito explicito es NO repetir un esquema fijo tipo "4x12 para
 * todo": la prescripcion cambia segun el ejercicio (fatiga que deja,
 * demanda tecnica, unilateralidad), el objetivo, la experiencia, la
 * posicion en la sesion y el volumen semanal que ya acumula ese musculo.
 *
 * Todo lo que sale de aqui es una SUGERENCIA. Se muestra aparte y no
 * modifica la rutina: aplicarla es siempre decision del usuario.
 */
import type {
  BiomechanicalExercise,
  ExperienceLevel,
  TrainingGoal,
} from "@/features/training/lib/biomechanics";

export type PrescriptionContext = {
  goal: TrainingGoal;
  experience: ExperienceLevel;
  /** Posicion del ejercicio en la sesion, empezando en 1. */
  positionInSession?: number;
  /** Series semanales que ya acumula el musculo principal. */
  weeklySetsForMuscle?: number;
};

export type Prescription = {
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  restSeconds: number;
  /** Como progresar cuando el esquema se domina. */
  progression: string;
  /** Por que salio esta prescripcion. Nunca se muestra sin motivos. */
  reasons: string[];
};

/**
 * Un ejercicio se considera compuesto cuando mueve varias articulaciones
 * o deja fatiga alta. No se usa una lista de nombres: se deduce de los
 * datos del catalogo.
 */
export function isCompound(exercise: BiomechanicalExercise): boolean {
  const joints = exercise.joints.length;
  const fatigue = exercise.systemicFatigue ?? 5;
  return joints >= 2 || fatigue >= 7;
}

/** Rangos base por objetivo, diferenciando compuesto de aislamiento. */
const BASE_BY_GOAL: Record<
  TrainingGoal,
  {
    compound: { reps: [number, number]; rir: number; rest: number };
    isolation: { reps: [number, number]; rir: number; rest: number };
  }
> = {
  fuerza: {
    compound: { reps: [3, 6], rir: 2, rest: 210 },
    isolation: { reps: [6, 10], rir: 2, rest: 120 },
  },
  hipertrofia: {
    compound: { reps: [5, 10], rir: 2, rest: 150 },
    isolation: { reps: [10, 15], rir: 1, rest: 90 },
  },
  recomposicion: {
    compound: { reps: [6, 10], rir: 2, rest: 150 },
    isolation: { reps: [10, 15], rir: 2, rest: 90 },
  },
  resistencia: {
    compound: { reps: [12, 15], rir: 3, rest: 75 },
    isolation: { reps: [15, 20], rir: 2, rest: 60 },
  },
};

/** Series base segun objetivo y si el ejercicio es compuesto. */
function baseSets(goal: TrainingGoal, compound: boolean): number {
  if (goal === "fuerza") return compound ? 4 : 3;
  if (goal === "resistencia") return compound ? 3 : 3;
  return compound ? 4 : 3;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const GOAL_LABELS: Record<TrainingGoal, string> = {
  fuerza: "fuerza",
  hipertrofia: "hipertrofia",
  recomposicion: "recomposicion",
  resistencia: "resistencia muscular",
};

/**
 * Volumen semanal por musculo a partir del cual conviene dejar de sumar
 * series. Es una referencia general y prudente, no un limite exacto: la
 * tolerancia real varia mucho entre personas.
 */
const HIGH_WEEKLY_VOLUME = 20;

export function recommendPrescription(
  exercise: BiomechanicalExercise,
  context: PrescriptionContext,
): Prescription {
  const compound = isCompound(exercise);
  const base = BASE_BY_GOAL[context.goal][compound ? "compound" : "isolation"];
  const reasons: string[] = [];

  let sets = baseSets(context.goal, compound);
  const [repsMin, repsMax] = base.reps;
  let rir = base.rir;
  let rest = base.rest;

  reasons.push(
    compound
      ? `Es un ejercicio compuesto (${exercise.joints.length || "varias"} articulaciones), asi que rinde mas en rangos de repeticion mas bajos y con descansos largos.`
      : "Es un ejercicio de aislamiento: tolera mas repeticiones y necesita menos descanso entre series.",
  );
  reasons.push(
    `El rango se ajusta a tu objetivo de ${GOAL_LABELS[context.goal]}.`,
  );

  // --- Experiencia ---
  if (context.experience === "principiante") {
    // Empezando conviene no acercarse al fallo: la tecnica se degrada
    // antes de que el musculo sea el limitante.
    rir = Math.min(4, rir + 1);
    sets = Math.max(2, sets - 1);
    reasons.push(
      "Como estas empezando, se deja mas margen al fallo (RIR mas alto) y menos series: primero se consolida la tecnica.",
    );
  } else if (context.experience === "avanzado") {
    rir = Math.max(0, rir - 1);
    reasons.push(
      "Con tu experiencia puedes acercarte mas al fallo manteniendo la tecnica.",
    );
  }

  // --- Demanda tecnica ---
  const demand = exercise.technicalDemand ?? 5;
  if (demand >= 8) {
    rir = Math.min(4, rir + 1);
    rest = Math.round(rest * 1.15);
    reasons.push(
      "Tiene una tecnica exigente: conviene no llegar al fallo y descansar algo mas para que cada serie salga limpia.",
    );
  }

  // --- Posicion en la sesion ---
  const position = context.positionInSession;
  if (position !== undefined && position >= 4) {
    sets = Math.max(2, sets - 1);
    reasons.push(
      `Va en la posicion ${position} de la sesion: llegas con fatiga acumulada, asi que menos series rinden mas que forzar el volumen.`,
    );
  } else if (position === 1 && compound) {
    reasons.push(
      "Abre la sesion, que es donde un compuesto rinde mejor: llegas fresco y puedes cargarlo bien.",
    );
  }

  // --- Fatiga sistemica ---
  const fatigue = exercise.systemicFatigue ?? 5;
  if (fatigue >= 9) {
    sets = Math.max(2, sets - 1);
    rest = Math.round(rest * 1.2);
    reasons.push(
      "Deja mucha fatiga acumulada: se recorta una serie y se alarga el descanso para no comprometer el resto de la semana.",
    );
  }

  // --- Volumen semanal ya acumulado ---
  const weeklySets = context.weeklySetsForMuscle;
  if (weeklySets !== undefined && weeklySets >= HIGH_WEEKLY_VOLUME) {
    sets = Math.max(2, sets - 1);
    reasons.push(
      `${exercise.primaryMuscle} ya acumula unas ${weeklySets} series semanales. Sumar mas rara vez aporta y complica la recuperacion.`,
    );
  }

  // --- Unilateral ---
  if (exercise.isUnilateral) {
    reasons.push(
      "Es unilateral: las series indicadas son POR LADO, y la sesion tomara mas tiempo.",
    );
  }

  sets = clamp(sets, 2, 6);
  rir = clamp(rir, 0, 4);
  rest = clamp(rest, 45, 300);

  return {
    sets,
    repsMin,
    repsMax,
    rir,
    restSeconds: rest,
    progression: buildProgression(repsMax, rir, compound),
    reasons,
  };
}

function buildProgression(
  repsMax: number,
  rir: number,
  compound: boolean,
): string {
  const increment = compound ? "2.5 a 5 kg" : "1 a 2.5 kg";
  return `Cuando completes ${repsMax} repeticiones en todas las series manteniendo RIR ${rir}, sube la carga ${increment} y vuelve al extremo bajo del rango.`;
}

/** Texto corto del esquema, para mostrarlo junto al ejercicio. */
export function formatPrescription(prescription: Prescription): string {
  return `${prescription.sets} x ${prescription.repsMin}-${prescription.repsMax} · RIR ${prescription.rir} · ${prescription.restSeconds}s`;
}
