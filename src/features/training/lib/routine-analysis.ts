/**
 * Analisis completo de una rutina
 * (docs/02_PRODUCT_REQUIREMENTS.md 14).
 *
 * Revisa volumen semanal por musculo, frecuencia, patrones de movimiento
 * cubiertos y ausentes, redundancias, orden de los ejercicios y datos de
 * prescripcion sin definir.
 *
 * Los hallazgos se clasifican por prioridad y SIEMPRE explican por que se
 * emiten. El analisis no modifica nada: es material para que el usuario
 * decida.
 */

export type FindingPriority =
  | "alta"
  | "mejora"
  | "opcional"
  | "observacion"
  | "sin_cambios";

export type RoutineFinding = {
  priority: FindingPriority;
  title: string;
  detail: string;
};

/** Ejercicio de la rutina con lo necesario para analizarla. */
export type RoutineExercise = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string | null;
  position: number;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  systemicFatigue: number | null;
};

export type RoutineDay = {
  name: string | null;
  dayIndex: number;
  exercises: RoutineExercise[];
};

export type RoutineAnalysis = {
  /** Series semanales por musculo, contando secundarios a mitad. */
  weeklySetsByMuscle: { muscle: string; sets: number }[];
  /** Veces por semana que se entrena cada musculo. */
  frequencyByMuscle: { muscle: string; days: number }[];
  coveredPatterns: string[];
  missingPatterns: string[];
  findings: RoutineFinding[];
};

/**
 * Patrones que una rutina general deberia cubrir. La ausencia de uno no
 * es un error automatico (una rutina especializada puede omitirlo a
 * proposito), por eso se reporta como mejora y no como prioridad alta.
 */
const CORE_PATTERNS = [
  "sentadilla",
  "bisagra de cadera",
  "empuje horizontal",
  "empuje vertical",
  "traccion horizontal",
  "traccion vertical",
] as const;

/**
 * Rangos de volumen semanal por musculo (BIO-004).
 *
 * Sustituyen al umbral unico de 22 series, que era un error CONCEPTUAL y no
 * de calibracion: la relacion entre volumen e hipertrofia tiene rendimientos
 * decrecientes, o sea que la curva SE APLANA, no cae. Marcar un techo
 * convierte una curva continua en un limite binario que la evidencia no
 * describe, y 07A ya prohibia el numero universal de series.
 *
 * Los rangos vienen de la investigacion aportada por el usuario en /Info,
 * anclados en el ACSM 2026 (mayor hipertrofia con ~10 o mas series/semana).
 */
const WEEKLY_SET_RANGES = {
  mantenimiento: { min: 2, max: 6 },
  principiante: { min: 6, max: 10 },
  intermedio: { min: 8, max: 16 },
  avanzado: { min: 10, max: 20 },
} as const;

/** Por debajo de esto el estimulo directo es probablemente insuficiente. */
const LOW_WEEKLY_SETS = WEEKLY_SET_RANGES.principiante.min;

/**
 * Punto a partir del cual conviene MIRAR, no cortar. No es un techo: la
 * pregunta no es "te pasaste" sino "cada serie extra te esta aportando".
 */
const DIMINISHING_RETURNS_FROM = WEEKLY_SET_RANGES.avanzado.max;

/** Un musculo secundario recibe estimulo parcial, no equivale a una serie directa. */
const SECONDARY_SET_WEIGHT = 0.5;

const round1 = (value: number) => Math.round(value * 10) / 10;

function accumulateVolume(days: RoutineDay[]): Map<string, number> {
  const volume = new Map<string, number>();

  for (const day of days) {
    for (const exercise of day.exercises) {
      // Sin series definidas no se puede contar volumen; se reporta aparte.
      const sets = exercise.sets ?? 0;
      if (sets <= 0) continue;

      volume.set(
        exercise.primaryMuscle,
        (volume.get(exercise.primaryMuscle) ?? 0) + sets,
      );
      for (const muscle of exercise.secondaryMuscles) {
        volume.set(
          muscle,
          (volume.get(muscle) ?? 0) + sets * SECONDARY_SET_WEIGHT,
        );
      }
    }
  }

  return volume;
}

function accumulateFrequency(days: RoutineDay[]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const day of days) {
    const musclesToday = new Set(
      day.exercises.map((exercise) => exercise.primaryMuscle),
    );
    for (const muscle of musclesToday) {
      frequency.set(muscle, (frequency.get(muscle) ?? 0) + 1);
    }
  }
  return frequency;
}

export function analyzeRoutine(days: RoutineDay[]): RoutineAnalysis {
  const findings: RoutineFinding[] = [];

  const allExercises = days.flatMap((day) => day.exercises);

  if (allExercises.length === 0) {
    return {
      weeklySetsByMuscle: [],
      frequencyByMuscle: [],
      coveredPatterns: [],
      missingPatterns: [...CORE_PATTERNS],
      findings: [
        {
          priority: "observacion",
          title: "Rutina vacia",
          detail:
            "Agrega ejercicios a los dias de la rutina para poder analizar volumen, frecuencia y patrones.",
        },
      ],
    };
  }

  const volume = accumulateVolume(days);
  const frequency = accumulateFrequency(days);

  const weeklySetsByMuscle = [...volume.entries()]
    .map(([muscle, sets]) => ({ muscle, sets: round1(sets) }))
    .sort((a, b) => b.sets - a.sets);

  const frequencyByMuscle = [...frequency.entries()]
    .map(([muscle, days_]) => ({ muscle, days: days_ }))
    .sort((a, b) => b.days - a.days);

  // --- Ejercicios sin prescripcion definida (prioridad alta: sin esto no
  //     se puede medir ni progresar) ---
  const withoutSets = allExercises.filter(
    (exercise) => exercise.sets === null || exercise.sets === 0,
  );
  if (withoutSets.length > 0) {
    findings.push({
      priority: "alta",
      title: `${withoutSets.length} ejercicio(s) sin series definidas`,
      detail: `Sin series no se puede calcular tu volumen ni seguir tu progreso: ${withoutSets
        .map((exercise) => exercise.name)
        .join(", ")}.`,
    });
  }

  const withoutReps = allExercises.filter(
    (exercise) => exercise.repsMin === null && exercise.repsMax === null,
  );
  if (withoutReps.length > 0) {
    findings.push({
      priority: "mejora",
      title: `${withoutReps.length} ejercicio(s) sin rango de repeticiones`,
      detail:
        "Definir un rango de repeticiones da un criterio claro para saber cuando subir la carga.",
    });
  }

  // --- Volumen por musculo ---
  for (const { muscle, sets } of weeklySetsByMuscle) {
    if (sets > DIMINISHING_RETURNS_FROM) {
      findings.push({
        priority: "mejora",
        title: `Volumen alto en ${muscle}`,
        detail: `Acumula unas ${sets} series semanales. Mas volumen sigue produciendo mas musculo, pero cada serie extra aporta menos que la anterior y cuesta la misma recuperacion. No es un limite: mira si tu rendimiento sube semana a semana y como duermes y te recuperas.`,
      });
    }
  }

  // Musculos entrenados de forma directa pero con muy poco volumen.
  const directMuscles = new Set(
    allExercises.map((exercise) => exercise.primaryMuscle),
  );
  for (const { muscle, sets } of weeklySetsByMuscle) {
    if (directMuscles.has(muscle) && sets < LOW_WEEKLY_SETS) {
      findings.push({
        priority: "opcional",
        title: `Volumen bajo en ${muscle}`,
        detail: `Solo acumula ${sets} series semanales. Si es un musculo que quieres desarrollar, suele hacer falta algo mas de volumen; si es intencional, ignora este aviso.`,
      });
    }
  }

  /*
   * --- Frecuencia ---
   *
   * BIO-005: con el volumen igualado, repartir el mismo trabajo en mas dias
   * NO produce mas hipertrofia de forma firme; solo en fuerza se identifica
   * el efecto de forma consistente. La frecuencia es una herramienta de
   * REPARTO, no un estimulo adicional, como ya decia 07A.
   *
   * Por eso este hallazgo no marca "entrenas poco cada musculo": solo avisa
   * cuando hay tanto volumen en una sesion que la calidad de las ultimas
   * series se resiente, que es el argumento practico real para repartir.
   */
  const oncePerWeek = frequencyByMuscle.filter((entry) => entry.days === 1);
  const highVolumeOnce = oncePerWeek.filter((entry) => {
    const sets = volume.get(entry.muscle) ?? 0;
    return sets >= 12;
  });
  if (highVolumeOnce.length > 0) {
    findings.push({
      priority: "opcional",
      title: "Volumen concentrado en un solo dia",
      detail: `${highVolumeOnce
        .map((entry) => entry.muscle)
        .join(", ")} concentra bastante volumen en una sola sesion. Repartirlo en dos dias no produce mas musculo por si solo, pero suele permitir que las ultimas series salgan con mejor calidad.`,
    });
  }

  // --- Patrones de movimiento ---
  const coveredPatterns = [
    ...new Set(
      allExercises
        .map((exercise) => exercise.movementPattern)
        .filter((pattern): pattern is string => pattern !== null),
    ),
  ];
  const missingPatterns = CORE_PATTERNS.filter(
    (pattern) => !coveredPatterns.includes(pattern),
  );
  if (missingPatterns.length > 0) {
    findings.push({
      priority: "mejora",
      title: "Patrones de movimiento sin cubrir",
      detail: `No aparece ningun ejercicio de: ${missingPatterns.join(", ")}. Si tu rutina es general, cubrirlos equilibra el desarrollo; si es especializada, puede ser intencional.`,
    });
  }

  // --- Redundancia dentro de un mismo dia ---
  for (const day of days) {
    const patternCount = new Map<string, number>();
    for (const exercise of day.exercises) {
      if (!exercise.movementPattern) continue;
      patternCount.set(
        exercise.movementPattern,
        (patternCount.get(exercise.movementPattern) ?? 0) + 1,
      );
    }
    for (const [pattern, count] of patternCount) {
      if (count >= 3) {
        findings.push({
          priority: "observacion",
          title: `Patron repetido en ${day.name ?? `dia ${day.dayIndex}`}`,
          detail: `Hay ${count} ejercicios del patron "${pattern}" el mismo dia. No es un error, pero revisa si aportan estimulos distintos o se solapan.`,
        });
      }
    }
  }

  // --- Orden: los ejercicios mas fatigantes deberian ir primero ---
  for (const day of days) {
    const ordered = [...day.exercises].sort((a, b) => a.position - b.position);
    const heavyLate = ordered.filter(
      (exercise) =>
        (exercise.systemicFatigue ?? 0) >= 8 && exercise.position >= 4,
    );
    const lightEarly = ordered.filter(
      (exercise) =>
        (exercise.systemicFatigue ?? 10) <= 3 && exercise.position <= 2,
    );
    if (heavyLate.length > 0 && lightEarly.length > 0) {
      findings.push({
        priority: "mejora",
        title: `Orden mejorable en ${day.name ?? `dia ${day.dayIndex}`}`,
        detail: `${heavyLate
          .map((exercise) => exercise.name)
          .join(", ")} exige mucho y va al final, mientras que ${lightEarly
          .map((exercise) => exercise.name)
          .join(", ")} abre la sesion. Los ejercicios mas demandantes suelen rendir mas cuando llegas fresco.`,
      });
    }
  }

  // Nada que corregir: se dice explicitamente, el silencio no comunica.
  if (findings.length === 0) {
    findings.push({
      priority: "sin_cambios",
      title: "La rutina se ve equilibrada",
      detail:
        "No encontramos ajustes prioritarios: cubre los patrones principales, el volumen esta en un rango razonable y el orden es coherente.",
    });
  }

  return {
    weeklySetsByMuscle,
    frequencyByMuscle,
    coveredPatterns,
    missingPatterns,
    findings: sortFindings(findings),
  };
}

const PRIORITY_ORDER: Record<FindingPriority, number> = {
  alta: 0,
  mejora: 1,
  opcional: 2,
  observacion: 3,
  sin_cambios: 4,
};

function sortFindings(findings: RoutineFinding[]): RoutineFinding[] {
  return [...findings].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}
