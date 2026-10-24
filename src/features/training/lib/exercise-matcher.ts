/**
 * Empareja el nombre de un ejercicio escrito por un entrenador, en español
 * de gimnasio, con el catálogo, que está casi entero en inglés.
 *
 * El emparejador genérico de nombres (`pickBestMatch`) compara palabras:
 * sirve para «Claras de huevo» frente a «Clara de huevo», pero no puede saber
 * que «jalón» es «pulldown», y aceptaba cualquier palabra en común. Con una
 * rutina real emparejó «lateral mancuerna» (elevación lateral) con
 * «Inclinación lateral con mancuerna», que es un ejercicio de oblicuos.
 *
 * Aquí, en tres pasos:
 *
 *   1. Se traduce el nombre a vocabulario de catálogo con un diccionario de
 *      frases de gimnasio: «press inclinado» → incline press, «jalón» →
 *      pulldown, «pantorrilla» → calfraise.
 *   2. Los movimientos compuestos quedan como UNA palabra («leg press» →
 *      legpress), para que «leg curl» no empareje con «leg press» por
 *      compartir «leg».
 *   3. El candidato tiene que tener el MOVIMIENTO del nombre (press, row,
 *      pulldown…). Si no, no vale, aunque comparta el equipo. Entre los que
 *      sí lo tienen gana el de más palabras en común y menos de sobra.
 *
 * Si nada pasa el umbral, no hay emparejamiento: es mejor dejarlo fuera y
 * decirlo que meter otro ejercicio en la rutina.
 */

export type ExerciseCandidate = { id: string; name: string };

const plano = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* Español de gimnasio → vocabulario del catálogo. Las frases largas van
   antes que sus palabras sueltas. */
const FRASES: [RegExp, string][] = [
  /* «Press plano máquina» es el press de pecho en máquina, no la banca con
     barra: sin esto, una rutina real lo emparejó con «Press de banca». */
  [
    /\bpress (?:plano |de pecho )?(?:en )?maquina\b|\bpress de pecho\b/g,
    "lever chest press",
  ],
  [/\bpress (?:de )?banca\b|\bpress plano\b/g, "bench press"],
  [/\bsentadillas? sis+y\b|\bsis+y squats?\b/g, "sissysquat"],
  [/\bpress militar\b|\bmilitar\b/g, "shoulderpress"],
  [/\bpress (?:de )?hombros?\b/g, "shoulderpress"],
  [/\bpress inclinados?\b|\bpress en banca inclinada\b/g, "incline press"],
  [/\bpress declinados?\b/g, "decline press"],
  [/\bcross ?over\b|\bcruce de poleas\b/g, "crossover"],
  [/\bpolea alta\b/g, "high cable"],
  [/\bpolea baja\b/g, "low cable"],
  [/\bpull ?over\b/g, "pullover"],
  [/\bpush ?ups?\b|\blagartijas?\b|\bflexiones de pecho\b/g, "pushup"],
  [/\bpull ?ups?\b|\bdominadas?\b/g, "pullup"],
  [/\bchin ?ups?\b/g, "chinup"],
  [
    /\bhip thrust\b|\bhit trust\b|\bhip trust\b|\bempuje de cadera\b/g,
    "hipthrust",
  ],
  [/\bpeso muerto\b/g, "deadlift"],
  [/\belevaci[oó]n(?:es)? de piernas?\b/g, "legraise"],
  [
    /\bflexi[oó]n (?:de piernas? )?acostado\b|\bcurl femoral acostado\b/g,
    "lying legcurl",
  ],
  [/\bcurl femoral\b|\bflexi[oó]n de piernas?\b|\bflexi[oó]n\b/g, "legcurl"],
  [/\bextensi[oó]n (?:de )?(?:piernas?|cuadriceps)\b/g, "legextension"],
  [
    /\btriceps? (?:en )?polea\b|\bjal[oó]n (?:de )?triceps?\b/g,
    "triceps pushdown cable",
  ],
  [/\bextensi[oó]n\b/g, "legextension"],
  [/\bdesplante bulgaro\b|\bsentadilla bulgara\b|\bbulgaro\b/g, "splitsquat"],
  [
    /\bdesplante estatico\b|\bdesplate estatico\b|\bzancada estatica\b/g,
    "splitsquat",
  ],
  [/\bdesplantes?\b|\bdesplates?\b|\bzancadas?\b/g, "lunge"],
  [/\bsentadillas?\b/g, "squat"],
  [/\bprensa\b/g, "legpress"],
  [/\bpantorrillas?\b|\bgemelos?\b/g, "calfraise"],
  [/\belevaci[oó]n(?:es)? laterales?\b|\blateral(?:es)?\b/g, "lateralraise"],
  [/\belevaci[oó]n(?:es)? frontales?\b|\bfrontal(?:es)?\b/g, "frontraise"],
  [/\bposterior(?:es)?\b|\bpajaros?\b/g, "reardelt"],
  [/\bjal[oó]n\b|\bjalones\b/g, "pulldown"],
  [/\bremo\b/g, "row"],
  [/\baperturas?\b/g, "fly"],
  [/\bfondos\b/g, "dip"],
  [/\bplancha\b/g, "plank"],
  [/\bcrunch\b|\babdominales?\b/g, "crunch"],
  /* «Martillo» es el agarre: en «bícep martillo» va con curl (lo pone
     «bícep»), en «frontal mancuerna martillo» no. */
  [/\bmartillo\b/g, "hammer"],
  [/\bbiceps?\b|\bcurl\b/g, "curl"],
  [/\btriceps?\b/g, "triceps"],
  [/\bmancuernas?\b/g, "dumbbell"],
  [/\bbarra\b/g, "barbell"],
  [/\bpolea\b|\bpoleas\b/g, "cable"],
  [/\bmaquina\b/g, "lever"],
  [/\bmecate\b|\bcuerda\b/g, "rope"],
  [/\binclinad[oa]s?\b/g, "incline"],
  [/\bdeclinad[oa]s?\b/g, "decline"],
  [/\bde pie\b/g, "standing"],
  [/\bsentad[oa]\b/g, "seated"],
  [/\bacostad[oa]\b/g, "lying"],
  [/\bindividual\b|\ba una mano\b|\bunilateral\b/g, "one arm"],
  [/\bagarre neutro\b|\bneutro\b/g, "neutral"],
  [/\babierto\b|\bagarre abierto\b|\bancho\b/g, "wide"],
  [/\bcerrado\b|\bagarre cerrado\b/g, "close"],
  [/\bzumo\b/g, "sumo"],
  [/\btriangulo\b/g, "vbar"],
  [/\bsmith\b/g, "smith"],
];

/* Inglés del catálogo → las mismas palabras compuestas. */
const COMPUESTOS: [RegExp, string][] = [
  [/\bbench press\b/g, "benchpress"],
  [
    /\bshoulder press\b|\bmilitary press\b|\boverhead press\b/g,
    "shoulderpress",
  ],
  [/\bleg press(?:es)?\b/g, "legpress"],
  [/\bleg curls?\b|\bhamstring curls?\b/g, "legcurl"],
  [/\bleg extensions?\b/g, "legextension"],
  [/\bcalf raises?\b|\bcalf press\b/g, "calfraise"],
  [/\blateral raises?\b|\bside laterals?\b/g, "lateralraise"],
  [/\bfront raises?\b/g, "frontraise"],
  [/\brear delt(?:oid)?\b/g, "reardelt"],
  [/\bpull ?ups?\b/g, "pullup"],
  [/\bchin ?ups?\b/g, "chinup"],
  [/\bpush ?ups?\b/g, "pushup"],
  [/\bhip thrusts?\b/g, "hipthrust"],
  [/\bleg raises?\b/g, "legraise"],
  [/\bsplit squats?\b/g, "splitsquat"],
  [/\bflyes?\b|\bflies\b/g, "fly"],
  [/\bcrossovers?\b/g, "crossover"],
  [/\bdumbbells?\b/g, "dumbbell"],
  [/\bcurls\b/g, "curl"],
  [/\bcrunches\b/g, "crunch"],
  [/\bdips\b/g, "dip"],
  [/\bpushdowns?\b/g, "pushdown"],
  [/\bpulldowns?\b/g, "pulldown"],
  [/\brows\b/g, "row"],
  [/\bsquats\b/g, "squat"],
  [/\blunges\b/g, "lunge"],
  [/\bdeadlifts\b/g, "deadlift"],
  [/\bplanks\b/g, "plank"],
  [/\bv bar\b/g, "vbar"],
];

/** Lo que define el ejercicio. El equipo y el agarre sólo afinan. */
const MOVIMIENTOS = new Set([
  "benchpress",
  "sissysquat",
  "press",
  "shoulderpress",
  "legpress",
  "crossover",
  "fly",
  "pullover",
  "pushup",
  "pullup",
  "chinup",
  "hipthrust",
  "deadlift",
  "legraise",
  "legcurl",
  "legextension",
  "splitsquat",
  "lunge",
  "squat",
  "calfraise",
  "lateralraise",
  "frontraise",
  "reardelt",
  "pulldown",
  "pushdown",
  "row",
  "dip",
  "plank",
  "crunch",
  "curl",
]);

const RUIDO = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "en",
  "con",
  "y",
  "a",
  "al",
  "the",
  "with",
  "on",
  "and",
  "v",
  "2",
  "3",
  "libre",
  "agarre",
  "prono",
  "supino",
  "power",
  "todo",
  "junto",
  // «Máquina hummer»: la marca (Hammer Strength) mal escrita, no un agarre.
  "hummer",
]);

/** El equipo: afina el movimiento, pero uno distinto es otro ejercicio. */
const EQUIPOS = new Set(["barbell", "dumbbell", "cable", "lever", "smith"]);

function aplicar(texto: string, reglas: [RegExp, string][]): string {
  let out = texto;
  for (const [patron, valor] of reglas) out = out.replace(patron, ` ${valor} `);
  return out;
}

/** Las palabras de un nombre, ya en vocabulario común. */
export function tokensDeEjercicio(nombre: string): Set<string> {
  const texto = aplicar(aplicar(plano(nombre), FRASES), COMPUESTOS);
  return new Set(
    texto
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && !RUIDO.has(w)),
  );
}

/* «press inclinado» trae `incline` y `press`; un catálogo dice «Incline
   Barbell Bench Press»: `benchpress` cuenta como `press`. */
const equivale = (palabra: string, otras: Set<string>) =>
  otras.has(palabra) ||
  (palabra === "press" &&
    (otras.has("benchpress") || otras.has("shoulderpress")));

export type ExerciseMatch = {
  candidate: ExerciseCandidate;
  score: number;
};

export function matchExercise(
  nombre: string,
  catalogo: ExerciseCandidate[],
): ExerciseMatch | null {
  const q = tokensDeEjercicio(nombre);
  const movimientos = [...q].filter((t) => MOVIMIENTOS.has(t));
  if (movimientos.length === 0) return null;
  // «Press» a secas («press power») no dice qué press: mejor no adivinar.
  if (q.size === 1 && q.has("press")) return null;

  let mejor: ExerciseMatch | null = null;
  for (const candidate of catalogo) {
    const c = tokensDeEjercicio(candidate.name);
    // El movimiento manda: sin él, no es el mismo ejercicio.
    if (!movimientos.every((m) => equivale(m, c))) continue;
    // Y el candidato no puede ser OTRO movimiento con el nuestro de adorno
    // («Front Raise And Pullover» no es una elevación frontal sin más).
    const otros = [...c].filter(
      (t) =>
        MOVIMIENTOS.has(t) && !q.has(t) && t !== "benchpress" && t !== "press",
    );
    // Salvo los que son el mismo gesto con otro nombre: el pájaro con polea
    // es un «rear delt fly».
    if (otros.some((t) => !(t === "fly" && q.has("reardelt")))) continue;
    // Un estiramiento no es el ejercicio, aunque nombre el músculo.
    if (c.has("stretch") && !q.has("stretch")) continue;
    /* Si el entrenador dijo el equipo, uno distinto no vale: «pull over
       polea» no es el pullover con barra. Sin equipo en el candidato, sí. */
    const equipoC = [...c].filter((t) => EQUIPOS.has(t));
    if (
      equipoC.length > 0 &&
      [...q].some((t) => EQUIPOS.has(t)) &&
      !equipoC.some((t) => q.has(t))
    )
      continue;

    let comunes = 0;
    for (const t of q) if (equivale(t, c)) comunes += 1;
    const sobran = [...c].filter((t) => !q.has(t)).length;
    // Dice con una penalización suave por cada palabra de más: entre
    // «Incline Barbell Bench Press» e «Incline Barbell Bench Press v. 2 on
    // stability ball» gana el primero.
    const score = (2 * comunes) / (q.size + c.size) - sobran * 0.02;
    if (!mejor || score > mejor.score) mejor = { candidate, score };
  }
  return mejor && mejor.score >= 0.34 ? mejor : null;
}

/**
 * Búsqueda para el selector: «remo mancuerna» encuentra «One-Arm Dumbbell
 * Row» aunque el catálogo esté en inglés. Suma lo que coincide por palabra
 * traducida y lo que coincide por texto literal, y ordena.
 */
export function searchExerciseCatalog(
  term: string,
  catalogo: ExerciseCandidate[],
  limit = 20,
): ExerciseCandidate[] {
  const literal = plano(term);
  if (literal.length < 2) return [];
  const q = tokensDeEjercicio(term);
  const scored: { candidate: ExerciseCandidate; score: number }[] = [];
  for (const candidate of catalogo) {
    const nombre = plano(candidate.name);
    const c = tokensDeEjercicio(candidate.name);
    let score = nombre.includes(literal) ? 2 : 0;
    for (const t of q)
      if (equivale(t, c)) score += MOVIMIENTOS.has(t) ? 1.5 : 1;
    if (score === 0) continue;
    score -= c.size * 0.05;
    scored.push({ candidate, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.candidate);
}
