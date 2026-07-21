/**
 * Analisis longitudinal de composicion corporal.
 *
 * Cada InBody (o medicion manual) se compara contra la medicion anterior
 * y contra la linea base, con deltas y porcentajes de cambio.
 *
 * Reglas de producto que no se rompen:
 * - Una sola medicion no es una tendencia. Con menos de dos registros no
 *   se emite ninguna conclusion.
 * - Los cambios por debajo del umbral de cada metrica se declaran
 *   estables: la bascula y la bioimpedancia tienen ruido, y presentar
 *   ese ruido como progreso seria falsa precision.
 * - Solo se califica como favorable o desfavorable lo que tiene una
 *   direccion inequivoca. El peso depende del objetivo del usuario.
 */

export type CompositionMetric =
  | "weightKg"
  | "bodyFatPercentage"
  | "fatMassKg"
  | "skeletalMuscleKg"
  | "leanMassKg"
  | "visceralFatLevel"
  | "bodyWaterPercentage"
  | "waistCm";

export type PrimaryGoal =
  | "recomposicion"
  | "perdida_grasa"
  | "ganancia_muscular"
  | "mantenimiento";

/** Medicion con lo necesario para el analisis de composicion. */
export type CompositionSnapshot = {
  measuredAt: string;
  source: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  skeletalMuscleKg: number | null;
  visceralFatLevel: number | null;
  bodyWaterPercentage: number | null;
  waistCm: number | null;
};

/** Snapshot con las magnitudes derivadas del peso y el % de grasa. */
export type DerivedSnapshot = CompositionSnapshot & {
  fatMassKg: number | null;
  leanMassKg: number | null;
};

export type ChangeDirection = "sube" | "baja" | "estable";
export type Assessment = "favorable" | "desfavorable" | "neutro";

export type MetricComparison = {
  metric: CompositionMetric;
  current: number;
  previous: number | null;
  baseline: number | null;
  /** Cambio contra la medicion inmediatamente anterior. */
  deltaPrevious: number | null;
  /** Cambio acumulado contra la primera medicion registrada. */
  deltaBaseline: number | null;
  /** Cambio porcentual acumulado contra la linea base. */
  percentChangeBaseline: number | null;
  direction: ChangeDirection;
  assessment: Assessment;
};

export type CompositionReport = {
  current: DerivedSnapshot;
  previous: DerivedSnapshot | null;
  baseline: DerivedSnapshot | null;
  comparisons: MetricComparison[];
  /** Perdio grasa y gano musculo a la vez: el mejor resultado posible. */
  isRecomposition: boolean;
  /** Numero de mediciones disponibles: contexto para leer lo anterior. */
  measurementCount: number;
  /** Dias entre la linea base y la medicion actual. */
  daysSinceBaseline: number | null;
};

/**
 * Umbral de ruido por metrica. Por debajo de esto el cambio se considera
 * estable: son magnitudes dentro del error de medicion de una bascula de
 * bioimpedancia o de una cinta metrica.
 */
const NOISE_THRESHOLDS: Record<CompositionMetric, number> = {
  weightKg: 0.3,
  bodyFatPercentage: 0.4,
  fatMassKg: 0.3,
  skeletalMuscleKg: 0.3,
  leanMassKg: 0.3,
  visceralFatLevel: 0.5,
  bodyWaterPercentage: 0.5,
  waistCm: 0.5,
};

/** Metricas donde bajar es mejor, sin importar el objetivo. */
const LOWER_IS_BETTER: CompositionMetric[] = [
  "bodyFatPercentage",
  "fatMassKg",
  "visceralFatLevel",
  "waistCm",
];

/** Metricas donde subir es mejor, sin importar el objetivo. */
const HIGHER_IS_BETTER: CompositionMetric[] = ["skeletalMuscleKg", "leanMassKg"];

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Masa grasa y masa magra en kg. Es la lectura mas util de un InBody:
 * el peso solo no distingue entre perder grasa y perder musculo.
 */
export function deriveSnapshot(snapshot: CompositionSnapshot): DerivedSnapshot {
  const { weightKg, bodyFatPercentage } = snapshot;
  if (weightKg === null || bodyFatPercentage === null) {
    return { ...snapshot, fatMassKg: null, leanMassKg: null };
  }
  const fatMassKg = round1((weightKg * bodyFatPercentage) / 100);
  return { ...snapshot, fatMassKg, leanMassKg: round1(weightKg - fatMassKg) };
}

function directionOf(
  metric: CompositionMetric,
  delta: number | null,
): ChangeDirection {
  if (delta === null || Math.abs(delta) < NOISE_THRESHOLDS[metric]) {
    return "estable";
  }
  return delta > 0 ? "sube" : "baja";
}

/**
 * Califica el cambio. El peso es deliberadamente ambiguo: subir es bueno
 * si se busca musculo y malo si se busca perder grasa, asi que se resuelve
 * con el objetivo del usuario y, sin objetivo claro, se deja neutro.
 */
function assess(
  metric: CompositionMetric,
  direction: ChangeDirection,
  goal: PrimaryGoal | null,
): Assessment {
  if (direction === "estable") return "neutro";

  if (LOWER_IS_BETTER.includes(metric)) {
    return direction === "baja" ? "favorable" : "desfavorable";
  }
  if (HIGHER_IS_BETTER.includes(metric)) {
    return direction === "sube" ? "favorable" : "desfavorable";
  }

  if (metric === "weightKg") {
    if (goal === "perdida_grasa") {
      return direction === "baja" ? "favorable" : "desfavorable";
    }
    if (goal === "ganancia_muscular") {
      return direction === "sube" ? "favorable" : "desfavorable";
    }
    // En recomposicion y mantenimiento el peso por si solo no dice nada:
    // lo que importa es como se reparte entre grasa y musculo.
    return "neutro";
  }

  // Agua corporal: depende de hidratacion, sodio y momento del dia.
  return "neutro";
}

function valueOf(
  snapshot: DerivedSnapshot | null,
  metric: CompositionMetric,
): number | null {
  if (!snapshot) return null;
  return snapshot[metric];
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${toDate}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}

/**
 * Compara la medicion mas reciente contra la anterior y contra la linea
 * base. Recibe las mediciones en cualquier orden.
 */
export function buildCompositionReport(
  measurements: CompositionSnapshot[],
  goal: PrimaryGoal | null = null,
): CompositionReport | null {
  if (measurements.length === 0) return null;

  const sorted = [...measurements]
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
    .map(deriveSnapshot);

  const current = sorted[sorted.length - 1]!;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2]! : null;
  // Con una sola medicion no hay linea base contra la cual comparar.
  const baseline = sorted.length > 1 ? sorted[0]! : null;

  const metrics: CompositionMetric[] = [
    "weightKg",
    "bodyFatPercentage",
    "fatMassKg",
    "skeletalMuscleKg",
    "leanMassKg",
    "visceralFatLevel",
    "bodyWaterPercentage",
    "waistCm",
  ];

  const comparisons: MetricComparison[] = [];

  for (const metric of metrics) {
    const currentValue = valueOf(current, metric);
    // Sin valor actual no hay nada que reportar de esa metrica.
    if (currentValue === null) continue;

    const previousValue = valueOf(previous, metric);
    const baselineValue = valueOf(baseline, metric);

    const deltaPrevious =
      previousValue !== null ? round1(currentValue - previousValue) : null;
    const deltaBaseline =
      baselineValue !== null ? round1(currentValue - baselineValue) : null;
    const percentChangeBaseline =
      baselineValue !== null && baselineValue !== 0
        ? round1(((currentValue - baselineValue) / baselineValue) * 100)
        : null;

    // La direccion se juzga contra la medicion anterior; si no la hay, se
    // usa la linea base, que en ese caso es la unica referencia.
    const referenceDelta = deltaPrevious ?? deltaBaseline;
    const direction = directionOf(metric, referenceDelta);

    comparisons.push({
      metric,
      current: currentValue,
      previous: previousValue,
      baseline: baselineValue,
      deltaPrevious,
      deltaBaseline,
      percentChangeBaseline,
      direction,
      assessment: assess(metric, direction, goal),
    });
  }

  return {
    current,
    previous,
    baseline,
    comparisons,
    isRecomposition: detectRecomposition(comparisons),
    measurementCount: sorted.length,
    daysSinceBaseline: baseline
      ? daysBetween(baseline.measuredAt, current.measuredAt)
      : null,
  };
}

/**
 * Recomposicion: perder grasa y ganar musculo al mismo tiempo. Se exige
 * que ambos cambios superen el umbral de ruido, para no anunciar una
 * recomposicion por decimas que caben en el error de medicion.
 */
function detectRecomposition(comparisons: MetricComparison[]): boolean {
  const fat = comparisons.find((c) => c.metric === "fatMassKg");
  const muscle = comparisons.find(
    (c) => c.metric === "skeletalMuscleKg" || c.metric === "leanMassKg",
  );
  if (!fat || !muscle) return false;
  return fat.direction === "baja" && muscle.direction === "sube";
}

/** Serie temporal de una metrica, para graficar su evolucion. */
export function compositionSeries(
  measurements: CompositionSnapshot[],
  metric: CompositionMetric,
): { date: string; value: number }[] {
  return [...measurements]
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
    .map(deriveSnapshot)
    .map((snapshot) => ({ date: snapshot.measuredAt, value: snapshot[metric] }))
    .filter((point): point is { date: string; value: number } =>
      point.value !== null,
    );
}
