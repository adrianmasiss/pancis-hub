/**
 * Importacion de rutinas escritas a mano
 * (docs/02_PRODUCT_REQUIREMENTS.md 9).
 *
 * Las rutinas suelen llegar como texto: un mensaje del entrenador, una
 * nota del telefono, un PDF del coach. El formato varia mucho, asi que el
 * analizador es deliberadamente TOLERANTE: reconoce lo que puede y marca lo
 * que no, en vez de rechazar el bloque entero.
 *
 * Ejemplos que reconoce:
 *   Dia 1 - Pierna
 *   Sentadilla 4x8-10 RIR 2 desc 120
 *   Prensa de pierna 3 x 12
 *   Curl femoral 3x15 @RPE 8
 *
 * Y lo que trae un PDF de entrenador (probado con una rutina real, oct 2026):
 *   Lunes                      ← el dia, y la linea siguiente es su nombre
 *   Pecho abdomen
 *   Nota mantener presionado…  ← nota del dia, no un ejercicio
 *   1. Press inclinado barra 4x12 más press power 4x12   ← superserie
 *   5. Aperturas en polea 4x12 sostiene 2 segundos       ← indicacion → nota
 *   abdomen                    ← subtitulo de grupo, no un ejercicio
 *   1. Plancha 1 minuto 3 series
 *   ● Circuito todo junto 3 series de 12 repeticiones    ← vale para lo que sigue
 *
 * Nada de esto se guarda automaticamente: el resultado se revisa antes.
 */

export type ParsedExercise = {
  /** Nombre tal como lo escribio la persona, sin la prescripcion. */
  rawName: string;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  rpe: number | null;
  restSeconds: number | null;
  /** Indicaciones del entrenador: «sostiene 2 seg», «al fallo», superserie. */
  notes: string | null;
};

export type ParsedDay = {
  name: string;
  exercises: ParsedExercise[];
  /** Las notas del dia («Nota trabajar despacio…»). */
  note: string | null;
};

export type ParsedRoutine = {
  days: ParsedDay[];
  /** Notas generales, antes del primer dia o al final («NOTA …»). */
  notes: string[];
  /** Lineas que no se pudieron interpretar, para mostrarlas al usuario. */
  ignoredLines: string[];
};

/** "Dia 1", "Día 2 - Pierna", "Lunes", "Day 3". */
const DAY_PATTERN =
  /^\s*(?:d[ií]a|day|jornada)\s*(\d+)\s*[-:.]?\s*(.*)$|^\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[-:.]?\s*(.*)$/i;

/** "4x8-10", "4 x 8", "3x12". */
const SETS_REPS_PATTERN = /(\d+)\s*[x×]\s*(\d+)\s*(?:[-–a]\s*(\d+))?/i;
/** "3 series de 12 repeticiones", "4 series". */
const SERIES_PATTERN =
  /(\d+)\s*series?(?:\s*de\s*(\d+)\s*(?:repeticiones|reps?)?)?/i;

const RIR_PATTERN = /\brir\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i;
const RPE_PATTERN = /\b(?:@\s*)?rpe\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i;
/** "desc 120", "descanso 90s", "rest 2min". */
const REST_PATTERN =
  /\b(?:desc(?:anso)?|rest)\s*[:=]?\s*(\d+)\s*(s|seg|segundos|m|min|minutos)?/i;

/** Una nota: «Nota …», «NOTA», «Notas». */
const NOTE_PATTERN = /^\s*notas?\b[:.\s-]*/i;

/** Viñeta o numeración al inicio: «1.», «2)», «-», «•», «●». */
const LIST_MARK = /^\s*(?:\d{1,2}[.)]|[-–*•●▪◦])\s*/;
/* Un número suelto al inicio también puede ser numeración («1 press militar
   barra de pie»), pero «150 abdominales» es la cantidad. Hasta 12 se toma
   como numeración. */
const BARE_NUMBER = /^\s*(\d{1,3})\s+(?=\D)/;

/* Las indicaciones que el entrenador escribe junto al ejercicio. Van a las
   notas, no al nombre: con ellas en el nombre no se encuentra el ejercicio
   en el catálogo. */
const CUES: RegExp[] = [
  /* Las de cadencia completas van antes que «despacio», que se comería la
     mitad («baja despacio 3 seg» dejaría «baja 3 seg» en el nombre). */
  /\bbaja\s+(?:despacio\s+|lento\s+)?(?:en\s+)?\d+\s*(?:seg(?:undos)?|s)\b/gi,
  /\bte\s+quedas\s+\d+\s*(?:seg(?:undos)?|s)(?:\s+abajo)?(?:\s+apretando\s+\p{L}+)?/giu,
  /\bsube\s+(?:explosivo|r[aá]pido|despacio)\b/gi,
  /\btrabaja\s+la\s+negativa\b/gi,
  /\b\d+\s+\d+\s+y\s+\d+(?:\s+con\s+las\s+\d+)?/gi,
  /\bsosti?en[ea]r?\s+(?:siempre\s+)?\d+\s*(?:seg(?:undos)?|s)\b(?:\s+arriba)?/gi,
  /\bdespacio\b/gi,
  /\bcadencia\s+\d+\s*(?:seg(?:undos)?|s)\b/gi,
  /\bal\s+fallo\b/gi,
  /\bfallo\b/gi,
  /\bpesado\b/gi,
  /\bcon\s+peso\b/gi,
  /\b(?:con\s+)?pies\s+en\s+banca\b/gi,
  /\bpecho\s+en\s+banca\b/gi,
  /\b\d+\s*minutos?\b/gi,
];

/** Subtítulos que agrupan, no ejercicios: «abdomen», «Bicep tricep piernas». */
const GROUP_WORDS =
  /^(?:pecho|abdomen|abdominales|abs|core|espalda|piernas?|hombros?|biceps?|bicep|triceps?|tricep|brazos?|gluteos?|glúteos?|pantorrillas?|cardio|y|e|,|&|\/|\s)+$/i;

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
  let name = line
    .replace(new RegExp(SETS_REPS_PATTERN.source, "gi"), " ")
    .replace(SERIES_PATTERN, " ")
    .replace(RIR_PATTERN, " ")
    .replace(RPE_PATTERN, " ")
    .replace(REST_PATTERN, " ");
  for (const cue of CUES) name = name.replace(cue, " ");
  return name
    .replace(LIST_MARK, "")
    .replace(/\b(?:en|con|y)\s*$/i, "")
    .replace(/[,;:+]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cuesOf(line: string): string[] {
  const found: string[] = [];
  for (const cue of CUES) {
    for (const m of line.matchAll(cue)) {
      const text = m[0].trim().toLowerCase();
      // «fallo» sale también dentro de «al fallo»: no se repite.
      if (!found.some((f) => f.includes(text))) found.push(text);
    }
  }
  return found;
}

function parseExerciseLine(line: string): ParsedExercise | null {
  let text = line.replace(LIST_MARK, "");
  // «150 abdominales»: el número es la cantidad, no la numeración.
  let count: number | null = null;
  const bare = text.match(BARE_NUMBER);
  if (bare) {
    const n = Number(bare[1]);
    text = text.slice(bare[0].length);
    if (n > 12) count = n;
  }

  const name = cleanName(text);
  // Sin nombre utilizable no hay ejercicio que crear.
  if (name.length < 3 || !/\p{L}{2}/u.test(name)) return null;

  const setsReps = text.match(SETS_REPS_PATTERN);
  const series = text.match(SERIES_PATTERN);
  const repsMin =
    toNumber(setsReps?.[2]) ?? toNumber(series?.[2]) ?? count ?? null;
  const repsMax = toNumber(setsReps?.[3]) ?? repsMin;
  const cues = cuesOf(text);

  return {
    rawName: capitalize(name),
    sets:
      toNumber(setsReps?.[1]) ?? toNumber(series?.[1]) ?? (count ? 1 : null),
    repsMin,
    repsMax,
    rir: toNumber(text.match(RIR_PATTERN)?.[1]),
    rpe: toNumber(text.match(RPE_PATTERN)?.[1]),
    restSeconds: parseRest(text),
    notes: cues.length ? capitalize(cues.join(", ")) : null,
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Una línea puede traer dos ejercicios unidos: «Press inclinado 4x12 más
 * press power 4x12», «Prensa 4x12 + hip thrust 3x12». Se separan, y cada uno
 * lleva en su nota con quién va en superserie.
 */
function splitSuperset(line: string): string[] {
  /* Dos ejercicios seguidos sin «más»: «Tricep fondos 4x12 tricep polea
     mecate 4x15». Se corta tras el primer «4x12» si lo que sigue empieza un
     nombre, no si sigue la frase («Posterior 4x12 en polea cruzado»). */
  const joined = line.replace(
    /(\d+\s*[x×]\s*\d+(?:\s*[-–]\s*\d+)?)\s+(?!(?:en|con|de|del|a|al|y|sostiene|sostener|pesado|despacio|cadencia|seg|segundos|más|mas|\+)\b)(?=\p{L}{3,}.*\d+\s*[x×]\s*\d+)/giu,
    "$1 + ",
  );
  const parts = joined
    .split(/\s+(?:m[aá]s|\+)\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  // Si una parte no tiene un nombre propio («más push up…» sí; «más 2»
  // no), no es una superserie: se deja la línea entera.
  if (parts.length < 2 || parts.some((p) => cleanName(p).length < 3))
    return [line];
  return parts;
}

/** «10 posterior, 10 lateral, 15 militar». */
const CIRCUIT_LIST = /^\d+\s+\p{L}[\p{L} ]*(?:,\s*\d+\s+\p{L}[\p{L} ]*)+$/u;

/** ¿Es un ejercicio aunque no traiga series? Si va numerado o con viñeta. */
const isListed = (line: string) =>
  LIST_MARK.test(line) || BARE_NUMBER.test(line);
const hasPrescription = (line: string) =>
  SETS_REPS_PATTERN.test(line) || SERIES_PATTERN.test(line);

export function parseRoutineText(text: string): ParsedRoutine {
  const days: ParsedDay[] = [];
  const notes: string[] = [];
  const ignoredLines: string[] = [];
  /* A dónde van las líneas que continúan una nota partida en dos líneas. */
  let noteTarget: { day: ParsedDay | null } | null = null;
  /* Tras «Lunes» sin nombre, la línea siguiente sin prescripción es el
     nombre del día («Pecho abdomen»). */
  let awaitingLabel: ParsedDay | null = null;
  /* «Circuito … 3 series de 12»: lo que sigue sin prescripción hereda eso. */
  let circuit: { sets: number | null; reps: number | null } | null = null;

  const pushNote = (day: ParsedDay | null, note: string) => {
    if (!note) return;
    if (day) day.note = day.note ? `${day.note} ${note}` : note;
    else notes.push(note);
  };

  /* Una superserie partida en dos renglones («… más» y debajo «push up al
     fallo…») se vuelve a unir antes de leerla. */
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    const prev = lines.at(-1);
    const trimmed = raw.trim();
    if (prev !== undefined && /\s(?:m[aá]s|\+)\s*$/i.test(prev))
      lines[lines.length - 1] = `${prev} ${trimmed}`;
    /* Un ejercicio numerado partido en dos renglones por el ancho de la
       página: el segundo empieza en minúscula («seg abajo apretando…»,
       «negativa 4x15»). Un subtítulo como «abdomen» no se une. */
    else if (
      prev !== undefined &&
      /^\p{Ll}/u.test(trimmed) &&
      isListed(prev) &&
      !GROUP_WORDS.test(trimmed) &&
      !DAY_PATTERN.test(trimmed) &&
      !NOTE_PATTERN.test(trimmed)
    )
      lines[lines.length - 1] = `${prev} ${trimmed}`;
    else lines.push(raw);
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (line.length === 0) continue;
    const current = days.at(-1) ?? null;

    const dayMatch = line.match(DAY_PATTERN);
    if (dayMatch) {
      const number = dayMatch[1];
      const labelFromNumber = dayMatch[2]?.trim();
      const weekday = dayMatch[3];
      const labelFromWeekday = dayMatch[4]?.trim();

      const name = weekday
        ? [capitalize(weekday.toLowerCase()), labelFromWeekday]
            .filter(Boolean)
            .join(" - ")
        : [`Dia ${number}`, labelFromNumber].filter(Boolean).join(" - ");

      const day: ParsedDay = { name, exercises: [], note: null };
      days.push(day);
      noteTarget = null;
      circuit = null;
      awaitingLabel = weekday ? (labelFromWeekday ? null : day) : null;
      continue;
    }

    const note = line.match(NOTE_PATTERN);
    if (note) {
      awaitingLabel = null;
      // Una nota al final de la rutina («NOTA: los sábados…») es general.
      noteTarget = {
        day: current && current.exercises.length === 0 ? current : null,
      };
      pushNote(noteTarget.day, capitalize(line.slice(note[0].length).trim()));
      continue;
    }

    if (awaitingLabel && !isListed(line) && !hasPrescription(line)) {
      awaitingLabel.name = `${awaitingLabel.name} - ${capitalize(line)}`;
      awaitingLabel = null;
      continue;
    }
    awaitingLabel = null;

    if (
      /^circuito\b/i.test(line.replace(LIST_MARK, "").replace(BARE_NUMBER, ""))
    ) {
      const series = line.match(SERIES_PATTERN);
      circuit = {
        sets: toNumber(series?.[1]),
        reps: toNumber(series?.[2]),
      };
      noteTarget = null;
      continue;
    }

    // Una línea suelta, sin numeración ni prescripción, que sigue a una
    // nota, es su continuación.
    if (noteTarget && !isListed(line) && !hasPrescription(line)) {
      pushNote(noteTarget.day, line);
      continue;
    }
    noteTarget = null;

    if (GROUP_WORDS.test(line)) {
      // Subtítulo de grupo dentro del día: no es un ejercicio.
      continue;
    }

    /* Una frase suelta dentro de un día, sin numeración ni series, es una
       indicación del entrenador («Todo en dropset al final de las
       series»), no un ejercicio. Los nombres de ejercicio sin series son
       cortos («Plancha»). */
    if (
      current &&
      !isListed(line) &&
      !hasPrescription(line) &&
      line.split(" ").length >= 5
    ) {
      pushNote(current, capitalize(line));
      continue;
    }

    /* Dentro de un circuito, «10 posterior, 10 lateral, 15 militar»: cada
       parte es un ejercicio con sus repeticiones. */
    if (circuit && CIRCUIT_LIST.test(line)) {
      const parsed = line.split(",").map((part) => {
        const [, reps, name] = part.trim().match(/^(\d+)\s+(.+)$/)!;
        return {
          rawName: capitalize(name!.trim()),
          sets: circuit!.sets,
          repsMin: Number(reps),
          repsMax: Number(reps),
          rir: null,
          rpe: null,
          restSeconds: null,
          notes: "En circuito",
        } satisfies ParsedExercise;
      });
      if (days.length === 0)
        days.push({ name: "Dia 1", exercises: [], note: null });
      days.at(-1)!.exercises.push(...parsed);
      continue;
    }

    // Antes del primer día, lo que no es un ejercicio claro (título,
    // nombre del entrenador) no abre un día inventado.
    if (days.length === 0 && !isListed(line) && !hasPrescription(line)) {
      if (line.length >= 3) notes.push(line);
      continue;
    }

    const parts = splitSuperset(line);
    const parsed = parts
      .map(parseExerciseLine)
      .filter((e): e is ParsedExercise => e !== null);
    if (parsed.length === 0) {
      ignoredLines.push(line);
      continue;
    }
    if (parsed.length > 1)
      parsed.forEach((exercise, i) => {
        const others = parsed
          .filter((_, j) => j !== i)
          .map((o) => o.rawName)
          .join(", ");
        const tag = `Superserie con ${others}`;
        exercise.notes = exercise.notes ? `${tag}. ${exercise.notes}` : tag;
      });
    if (circuit)
      for (const exercise of parsed) {
        exercise.sets ??= circuit.sets;
        exercise.repsMin ??= circuit.reps;
        exercise.repsMax ??= circuit.reps;
        exercise.notes = exercise.notes
          ? `En circuito. ${exercise.notes}`
          : "En circuito";
      }

    // Un ejercicio antes de declarar un dia se asigna a uno implicito: es
    // comun que la rutina empiece directo con la lista.
    if (days.length === 0)
      days.push({ name: "Dia 1", exercises: [], note: null });
    days.at(-1)!.exercises.push(...parsed);
  }

  /* El descanso que fijan las notas generales («descansos no mayores a 40
     segundos») vale para los ejercicios que no dicen otro. */
  const restNote = notes
    .join(" ")
    .match(/descansos?[^.\d]*?(\d+)\s*(seg|segundos|s|min|minutos)\b/i);
  if (restNote) {
    const amount = Number(restNote[1]);
    const seconds = restNote[2]!.toLowerCase().startsWith("m")
      ? amount * 60
      : amount;
    for (const day of days)
      for (const exercise of day.exercises) exercise.restSeconds ??= seconds;
  }

  // Los dias sin ejercicios no aportan nada al plan.
  return {
    days: days.filter((day) => day.exercises.length > 0),
    notes,
    ignoredLines,
  };
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
