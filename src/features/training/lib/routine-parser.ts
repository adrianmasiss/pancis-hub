/**
 * Importacion de rutinas escritas a mano
 * (docs/02_PRODUCT_REQUIREMENTS.md 9).
 *
 * Las rutinas suelen llegar como texto: un mensaje del entrenador, una
 * nota del telefono, una captura transcrita. El formato varia mucho, asi
 * que el analizador es deliberadamente TOLERANTE: reconoce lo que puede y
 * marca lo que no, en vez de rechazar el bloque entero.
 *
 * Ejemplos que reconoce:
 *   Dia 1 - Pierna
 *   Sentadilla 4x8-10 RIR 2 desc 120
 *   Prensa de pierna 3 x 12
 *   Curl femoral 3x15 @RPE 8
 *
 * Nada de esto se guarda automaticamente: el resultado se revisa antes.
 */

export type ParsedExercise = {
  /** Nombre tal como lo escribio la persona. */
  rawName: string;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  rpe: number | null;
  restSeconds: number | null;
};

export type ParsedDay = {
  name: string;
  exercises: ParsedExercise[];
};

export type ParsedRoutine = {
  days: ParsedDay[];
  /** Lineas que no se pudieron interpretar, para mostrarlas al usuario. */
  ignoredLines: string[];
};

/** "Dia 1", "Día 2 - Pierna", "Lunes", "Day 3". */
const DAY_PATTERN =
  /^\s*(?:d[ií]a|day|jornada)\s*(\d+)\s*[-:.]?\s*(.*)$|^\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[-:.]?\s*(.*)$/i;

/** "4x8-10", "4 x 8", "3x12". */
const SETS_REPS_PATTERN = /(\d+)\s*[x×]\s*(\d+)\s*(?:[-–a]\s*(\d+))?/i;

const RIR_PATTERN = /\brir\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i;
const RPE_PATTERN = /\b(?:@\s*)?rpe\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i;
/** "desc 120", "descanso 90s", "rest 2min". */
const REST_PATTERN =
  /\b(?:desc(?:anso)?|rest)\s*[:=]?\s*(\d+)\s*(s|seg|segundos|m|min|minutos)?/i;

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRest(line: string): number | null {
  const match = line.match(REST_PATTERN);
  if (!match) return null;
  const amount = toNumber(match[1]);
  if (amount === null) return null;
  // "m", "min" y "minutos" son minutos; el resto (s, seg, o sin unidad)
  // se toma como segundos.
  const unit = (match[2] ?? "").toLowerCase();
  return unit.startsWith("m") ? amount * 60 : amount;
}

/** Quita del nombre todo lo que ya se interpreto como prescripcion. */
function cleanName(line: string): string {
  return line
    .replace(SETS_REPS_PATTERN, " ")
    .replace(RIR_PATTERN, " ")
    .replace(RPE_PATTERN, " ")
    .replace(REST_PATTERN, " ")
    // Vinetas y numeracion al inicio.
    .replace(/^[\s*\-–•]+/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[,;:]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseExerciseLine(line: string): ParsedExercise | null {
  const name = cleanName(line);
  // Sin nombre utilizable no hay ejercicio que crear.
  if (name.length < 3) return null;

  const setsReps = line.match(SETS_REPS_PATTERN);
  const repsMin = toNumber(setsReps?.[2]);
  const repsMax = toNumber(setsReps?.[3]) ?? repsMin;

  return {
    rawName: name,
    sets: toNumber(setsReps?.[1]),
    repsMin,
    repsMax,
    rir: toNumber(line.match(RIR_PATTERN)?.[1]),
    rpe: toNumber(line.match(RPE_PATTERN)?.[1]),
    restSeconds: parseRest(line),
  };
}

export function parseRoutineText(text: string): ParsedRoutine {
  const days: ParsedDay[] = [];
  const ignoredLines: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const dayMatch = line.match(DAY_PATTERN);
    if (dayMatch) {
      const number = dayMatch[1];
      const labelFromNumber = dayMatch[2]?.trim();
      const weekday = dayMatch[3];
      const labelFromWeekday = dayMatch[4]?.trim();

      const name = weekday
        ? [weekday, labelFromWeekday].filter(Boolean).join(" - ")
        : [`Dia ${number}`, labelFromNumber].filter(Boolean).join(" - ");

      days.push({ name, exercises: [] });
      continue;
    }

    const exercise = parseExerciseLine(line);
    if (!exercise) {
      ignoredLines.push(line);
      continue;
    }

    // Un ejercicio antes de declarar un dia se asigna a uno implicito: es
    // comun que la rutina empiece directo con la lista.
    if (days.length === 0) days.push({ name: "Dia 1", exercises: [] });
    days[days.length - 1]!.exercises.push(exercise);
  }

  // Los dias sin ejercicios no aportan nada al plan.
  return { days: days.filter((day) => day.exercises.length > 0), ignoredLines };
}

/** Resumen para mostrar antes de guardar. */
export function summarizeRoutine(routine: ParsedRoutine): {
  dayCount: number;
  exerciseCount: number;
} {
  return {
    dayCount: routine.days.length,
    exerciseCount: routine.days.reduce(
      (total, day) => total + day.exercises.length,
      0,
    ),
  };
}
