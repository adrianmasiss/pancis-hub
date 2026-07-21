/**
 * Valoracion biomecanica contextual de un ejercicio
 * (docs/02_PRODUCT_REQUIREMENTS.md 11).
 *
 * Reglas que no se rompen:
 * - NUNCA se muestra una puntuacion sin motivo. Cada valoracion trae la
 *   razon por la que salio ese numero.
 * - La valoracion depende del CONTEXTO (objetivo, experiencia, equipo,
 *   posicion en la rutina), no solo del ejercicio: la misma inestabilidad
 *   que penaliza a un principiante puede ser irrelevante para alguien
 *   avanzado.
 * - Nada de esto es una verdad universal. La estructura individual, la
 *   movilidad y la tecnica modifican la respuesta de cada persona, y la
 *   UI lo dice explicitamente.
 */

export type ResistanceProfile =
  | "ascendente"
  | "descendente"
  | "constante"
  | "en_campana";

export type ExperienceLevel = "principiante" | "intermedio" | "avanzado";

export type TrainingGoal =
  | "hipertrofia"
  | "fuerza"
  | "resistencia"
  | "recomposicion";

/** Atributos intrinsecos del ejercicio, tal como los guarda el catalogo. */
export type BiomechanicalExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string | null;
  equipment: string | null;
  difficulty: string | null;
  joints: string[];
  resistanceProfile: ResistanceProfile | null;
  hardestPoint: string | null;
  stability: number | null;
  rangeOfMotion: number | null;
  technicalDemand: number | null;
  systemicFatigue: number | null;
  progressionEase: number | null;
  isUnilateral: boolean;
  commonErrors: string[];
  techniqueCues: string[];
  /** Posicion inicial del movimiento. */
  imageUrl: string | null;
  /** Posicion final; juntas comunican el movimiento. */
  imageEndUrl: string | null;
};

export type RatingContext = {
  goal: TrainingGoal;
  experience: ExperienceLevel;
  /** Equipo disponible; vacio = sin restriccion declarada. */
  availableEquipment?: string[];
  /** Posicion dentro de la sesion, empezando en 1. */
  positionInSession?: number;
};

export type RatingDimension =
  | "objetivo"
  | "estabilidad"
  | "rango"
  | "progresion"
  | "demandaTecnica"
  | "fatiga";

export type ExerciseRating = {
  dimension: RatingDimension;
  /** 1-10. Mayor siempre es "mejor para este contexto". */
  score: number;
  /** Por que salio ese numero. Obligatorio: nunca se muestra solo. */
  reason: string;
};

const clamp = (value: number, min = 1, max = 10) =>
  Math.min(max, Math.max(min, Math.round(value)));

/** Valor por defecto prudente cuando el catalogo no tiene el dato. */
const DEFAULT_SCORE = 5;

/**
 * Ajuste del ejercicio al objetivo. El perfil de resistencia y el rango
 * importan mas para hipertrofia; la capacidad de cargar y progresar pesa
 * mas para fuerza.
 */
function rateGoalFit(
  exercise: BiomechanicalExercise,
  context: RatingContext,
): ExerciseRating {
  const rom = exercise.rangeOfMotion ?? DEFAULT_SCORE;
  const progression = exercise.progressionEase ?? DEFAULT_SCORE;
  const stability = exercise.stability ?? DEFAULT_SCORE;
  const fatigue = exercise.systemicFatigue ?? DEFAULT_SCORE;

  if (context.goal === "fuerza") {
    // Para fuerza interesa poder cargar y medir el progreso.
    const score = clamp(progression * 0.6 + stability * 0.2 + rom * 0.2);
    return {
      dimension: "objetivo",
      score,
      reason:
        progression >= 7
          ? "Permite anadir carga de forma medible, que es lo que impulsa la fuerza."
          : "Progresar en carga aqui es mas dificil, asi que rinde menos como ejercicio principal de fuerza.",
    };
  }

  if (context.goal === "resistencia") {
    // Aguantar series largas es mas facil donde no hay que estabilizar.
    const score = clamp(stability * 0.5 + rom * 0.3 + (10 - fatigue) * 0.2);
    return {
      dimension: "objetivo",
      score,
      reason:
        stability >= 7
          ? "Su estabilidad permite series largas sin que la tecnica se degrade por fatiga."
          : "Al fatigarte, la tecnica se degrada antes por la estabilidad que exige.",
    };
  }

  // Hipertrofia y recomposicion comparten logica: tension en un rango
  // amplio y posibilidad de progresar sin fatiga desproporcionada.
  const score = clamp(rom * 0.45 + progression * 0.35 + stability * 0.2);
  return {
    dimension: "objetivo",
    score,
    reason:
      rom >= 8
        ? "Trabaja el musculo en un rango amplio, lo que favorece el estimulo de crecimiento."
        : rom <= 4
          ? "Su rango de movimiento es corto, asi que aporta menos estimulo por serie."
          : "Ofrece un rango de trabajo intermedio, util como complemento.",
  };
}

/**
 * La estabilidad se juzga contra la experiencia: un ejercicio inestable
 * penaliza mucho a un principiante y poco a alguien avanzado, que ya sabe
 * sostener la posicion.
 */
function rateStability(
  exercise: BiomechanicalExercise,
  context: RatingContext,
): ExerciseRating {
  const stability = exercise.stability ?? DEFAULT_SCORE;

  if (context.experience === "principiante" && stability <= 4) {
    return {
      dimension: "estabilidad",
      score: clamp(stability + 1),
      reason:
        "Exige sostener mucho la posicion; empezando, buena parte del esfuerzo se va en estabilizar en vez de en el musculo objetivo.",
    };
  }

  if (context.experience === "avanzado" && stability <= 4) {
    return {
      dimension: "estabilidad",
      score: clamp(stability + 3),
      reason:
        "Es poco estable, pero con tu experiencia eso deja de ser el factor limitante.",
    };
  }

  return {
    dimension: "estabilidad",
    score: stability,
    reason:
      stability >= 8
        ? "El equipo sostiene la carga por ti, asi que puedes concentrarte en el musculo objetivo."
        : "Pide un nivel de control corporal moderado durante la serie.",
  };
}

function rateRangeOfMotion(
  exercise: BiomechanicalExercise,
): ExerciseRating {
  const rom = exercise.rangeOfMotion ?? DEFAULT_SCORE;
  return {
    dimension: "rango",
    score: rom,
    reason:
      rom >= 8
        ? "Recorre el musculo en un rango amplio, incluida la parte estirada."
        : rom <= 3
          ? "El recorrido es muy corto: es un ejercicio de sosten mas que de rango."
          : "Recorrido intermedio, sin llegar a las posiciones mas estiradas.",
  };
}

function rateProgression(
  exercise: BiomechanicalExercise,
): ExerciseRating {
  const progression = exercise.progressionEase ?? DEFAULT_SCORE;
  return {
    dimension: "progresion",
    score: progression,
    reason:
      progression >= 8
        ? "Admite incrementos pequenos y constantes de carga, facil de progresar semana a semana."
        : progression <= 4
          ? "Progresar exige saltos grandes o cambiar de variante, asi que avanza mas lento."
          : "Se puede progresar con cierta regularidad.",
  };
}

/**
 * Demanda tecnica: la puntuacion representa "que tan accesible es para
 * ti", asi que se invierte respecto al dato crudo y se ajusta por
 * experiencia.
 */
function rateTechnicalDemand(
  exercise: BiomechanicalExercise,
  context: RatingContext,
): ExerciseRating {
  const demand = exercise.technicalDemand ?? DEFAULT_SCORE;
  const accessibility = 11 - demand;

  if (context.experience === "principiante" && demand >= 7) {
    return {
      dimension: "demandaTecnica",
      score: clamp(accessibility - 2),
      reason:
        "Tiene una tecnica exigente: conviene aprenderlo con poca carga o con supervision antes de cargarlo.",
    };
  }

  if (context.experience === "avanzado" && demand >= 7) {
    return {
      dimension: "demandaTecnica",
      score: clamp(accessibility + 2),
      reason:
        "Es tecnicamente exigente, pero esta dentro de lo que ya dominas.",
    };
  }

  return {
    dimension: "demandaTecnica",
    score: clamp(accessibility),
    reason:
      demand <= 3
        ? "Tecnica sencilla: se aprende rapido y es dificil hacerlo mal."
        : "Tecnica de dificultad media; vale la pena revisarla de vez en cuando.",
  };
}

/**
 * Fatiga: mayor puntuacion = menos costoso para el resto de la sesion.
 * Un ejercicio muy fatigante colocado al final penaliza mas, porque
 * llegas a el ya cansado y compromete la calidad de las series.
 */
function rateFatigue(
  exercise: BiomechanicalExercise,
  context: RatingContext,
): ExerciseRating {
  const fatigue = exercise.systemicFatigue ?? DEFAULT_SCORE;
  const position = context.positionInSession;

  if (fatigue >= 8 && position !== undefined && position >= 4) {
    return {
      dimension: "fatiga",
      score: clamp(11 - fatigue - 1),
      reason: `Es de los ejercicios mas demandantes y lo tienes en la posicion ${position} de la sesion: llegaras cansado y la calidad de las series baja. Suele rendir mas al principio.`,
    };
  }

  return {
    dimension: "fatiga",
    score: clamp(11 - fatigue),
    reason:
      fatigue >= 8
        ? "Deja mucha fatiga acumulada: condiciona lo que puedas hacer despues, ese dia y en los siguientes."
        : fatigue <= 3
          ? "Fatiga baja: se puede acumular volumen sin comprometer el resto de la sesion."
          : "Fatiga moderada, manejable dentro de una sesion normal.",
  };
}

/**
 * Todas las valoraciones de un ejercicio para un contexto dado. El orden
 * es estable para que la UI no baile entre renders.
 */
export function rateExercise(
  exercise: BiomechanicalExercise,
  context: RatingContext,
): ExerciseRating[] {
  return [
    rateGoalFit(exercise, context),
    rateStability(exercise, context),
    rateRangeOfMotion(exercise),
    rateProgression(exercise),
    rateTechnicalDemand(exercise, context),
    rateFatigue(exercise, context),
  ];
}

/** Descripcion legible del perfil de resistencia. */
export const RESISTANCE_PROFILE_DESCRIPTIONS: Record<
  ResistanceProfile,
  string
> = {
  ascendente:
    "La resistencia se siente mas dificil conforme avanzas hacia el final del recorrido.",
  descendente:
    "Lo mas dificil esta al principio del recorrido y se aligera hacia el final.",
  constante:
    "La resistencia se mantiene pareja durante todo el recorrido.",
  en_campana:
    "Lo mas dificil esta a mitad del recorrido, y se aligera en los extremos.",
};
