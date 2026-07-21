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
 * Referencias de volumen semanal por musculo. Son orientaciones generales
 * y prudentes: la tolerancia individual varia mucho, por eso el texto
 * habla de "suele" y no de limites exactos.
 */
const LOW_WEEKLY_SETS = 6;
const HIGH_WEEKLY_SETS = 22;

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
    if (sets > HIGH_WEEKLY_SETS) {
      findings.push({
        priority: "mejora",
        title: `Volumen alto en ${muscle}`,
        detail: `Acumula unas ${sets} series semanales. Por encima de ~${HIGH_WEEKLY_SETS} el estimulo extra suele rendir poco y complica la recuperacion. Revisa si todo ese volumen te esta aportando.`,
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

  // --- Frecuencia ---
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
        .join(", ")} concentra bastante volumen en una sola sesion. Repartirlo en dos dias suele permitir mantener mejor la calidad de las series.`,
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
