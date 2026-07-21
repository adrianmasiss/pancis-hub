/**
 * Comparacion explicada entre dos ejercicios
 * (docs/02_PRODUCT_REQUIREMENTS.md 12).
 *
 * No basta con decir "puedes cambiar A por B": hay que decir en que se
 * parecen, en que no, que ganas y que pierdes. Todo el texto que ve el
 * usuario se genera aqui, de forma determinista y explicable.
 */
import {
  RESISTANCE_PROFILE_DESCRIPTIONS,
  type BiomechanicalExercise,
} from "@/features/training/lib/biomechanics";

export type ExerciseComparison = {
  /** 0-10: que tan buen sustituto es del original. */
  compatibility: number;
  similarities: string[];
  advantages: string[];
  differences: string[];
  limitations: string[];
  /** Una frase que resume por que se recomienda (o no). */
  recommendation: string;
};

/** Diferencia a partir de la cual una escala 1-10 se considera relevante. */
const SCALE_DELTA = 2;

const round1 = (value: number) => Math.round(value * 10) / 10;

function scale(value: number | null): number | null {
  return value === null || value === undefined ? null : value;
}

/**
 * Compatibilidad 0-10 como sustituto. Lo que mas pesa es entrenar el
 * mismo musculo con el mismo patron: sin eso, no es un sustituto por muy
 * parecido que sea en lo demas.
 */
function computeCompatibility(
  source: BiomechanicalExercise,
  candidate: BiomechanicalExercise,
): number {
  let score = 0;

  // Musculo principal: sin esto no hay sustitucion real.
  if (candidate.primaryMuscle === source.primaryMuscle) score += 4.5;

  // Mismo patron de movimiento.
  if (
    source.movementPattern !== null &&
    candidate.movementPattern === source.movementPattern
  ) {
    score += 2;
  }

  // Articulaciones compartidas.
  const sharedJoints = candidate.joints.filter((joint) =>
    source.joints.includes(joint),
  ).length;
  const jointUniverse = new Set([...source.joints, ...candidate.joints]).size;
  if (jointUniverse > 0) score += (sharedJoints / jointUniverse) * 1.5;

  // Musculos secundarios compartidos.
  const sharedSecondary = candidate.secondaryMuscles.filter((muscle) =>
    source.secondaryMuscles.includes(muscle),
  ).length;
  score += Math.min(sharedSecondary, 2) * 0.4;

  // Perfil de resistencia igual: se siente parecido durante la serie.
  if (
    source.resistanceProfile !== null &&
    candidate.resistanceProfile === source.resistanceProfile
  ) {
    score += 0.7;
  }

  // Rango de movimiento similar.
  const sourceRom = scale(source.rangeOfMotion);
  const candidateRom = scale(candidate.rangeOfMotion);
  if (sourceRom !== null && candidateRom !== null) {
    score += Math.max(0, 1 - Math.abs(sourceRom - candidateRom) / 10);
  }

  return round1(Math.min(10, score));
}

function describeScaleDifference(
  label: string,
  sourceValue: number | null,
  candidateValue: number | null,
  higherIsMoreOf: string,
  lowerIsMoreOf: string,
): string | null {
  if (sourceValue === null || candidateValue === null) return null;
  const delta = candidateValue - sourceValue;
  if (Math.abs(delta) < SCALE_DELTA) return null;
  return delta > 0
    ? `${label}: ${higherIsMoreOf}`
    : `${label}: ${lowerIsMoreOf}`;
}

/**
 * Compara un ejercicio candidato contra el original y redacta en que se
 * parecen, que se gana y que se pierde.
 */
export function compareExercises(
  source: BiomechanicalExercise,
  candidate: BiomechanicalExercise,
): ExerciseComparison {
  const similarities: string[] = [];
  const advantages: string[] = [];
  const differences: string[] = [];
  const limitations: string[] = [];

  // --- Similitudes ---
  if (candidate.primaryMuscle === source.primaryMuscle) {
    similarities.push(`Entrena el mismo musculo principal: ${source.primaryMuscle}.`);
  }
  if (
    source.movementPattern !== null &&
    candidate.movementPattern === source.movementPattern
  ) {
    similarities.push(`Comparte el patron de movimiento (${source.movementPattern}).`);
  }

  const sharedJoints = candidate.joints.filter((joint) =>
    source.joints.includes(joint),
  );
  if (sharedJoints.length > 0) {
    similarities.push(`Involucra las mismas articulaciones: ${sharedJoints.join(", ")}.`);
  }

  const sharedSecondary = candidate.secondaryMuscles.filter((muscle) =>
    source.secondaryMuscles.includes(muscle),
  );
  if (sharedSecondary.length > 0) {
    similarities.push(`Tambien acompanan: ${sharedSecondary.join(", ")}.`);
  }

  if (
    source.resistanceProfile !== null &&
    candidate.resistanceProfile === source.resistanceProfile
  ) {
    similarities.push(
      `Perfil de resistencia parecido. ${RESISTANCE_PROFILE_DESCRIPTIONS[candidate.resistanceProfile]}`,
    );
  }

  // --- Diferencias ---
  if (candidate.primaryMuscle !== source.primaryMuscle) {
    differences.push(
      `Cambia el musculo principal: pasa de ${source.primaryMuscle} a ${candidate.primaryMuscle}.`,
    );
  }
  if (
    source.movementPattern !== null &&
    candidate.movementPattern !== null &&
    candidate.movementPattern !== source.movementPattern
  ) {
    differences.push(
      `Otro patron de movimiento: ${candidate.movementPattern} en vez de ${source.movementPattern}.`,
    );
  }
  if (
    source.resistanceProfile !== null &&
    candidate.resistanceProfile !== null &&
    candidate.resistanceProfile !== source.resistanceProfile
  ) {
    differences.push(
      `La resistencia se reparte distinto. ${RESISTANCE_PROFILE_DESCRIPTIONS[candidate.resistanceProfile]}`,
    );
  }
  if (candidate.equipment !== source.equipment) {
    differences.push(
      `Requiere otro equipo: ${candidate.equipment ?? "sin equipo"} en lugar de ${source.equipment ?? "sin equipo"}.`,
    );
  }
  if (candidate.isUnilateral !== source.isUnilateral) {
    differences.push(
      candidate.isUnilateral
        ? "Es unilateral: trabaja un lado a la vez, util para corregir asimetrias, pero la serie toma el doble de tiempo."
        : "Es bilateral: trabaja ambos lados a la vez, asi que la serie es mas corta.",
    );
  }

  // --- Ventajas y limitaciones, desde las escalas ---
  const stabilityNote = describeScaleDifference(
    "Estabilidad",
    scale(source.stability),
    scale(candidate.stability),
    "es mas estable, asi que cuesta menos controlarlo y es mas facil llevarlo al fallo con seguridad.",
    "exige mas control corporal, asi que parte del esfuerzo se va en estabilizar.",
  );
  if (stabilityNote) {
    const isMoreStable =
      (candidate.stability ?? 0) > (source.stability ?? 0);
    (isMoreStable ? advantages : limitations).push(stabilityNote);
  }

  const romNote = describeScaleDifference(
    "Rango",
    scale(source.rangeOfMotion),
    scale(candidate.rangeOfMotion),
    "recorre un rango mayor, con mas estimulo por repeticion.",
    "recorre un rango menor, con menos estimulo por repeticion.",
  );
  if (romNote) {
    const isLonger =
      (candidate.rangeOfMotion ?? 0) > (source.rangeOfMotion ?? 0);
    (isLonger ? advantages : limitations).push(romNote);
  }

  const progressionNote = describeScaleDifference(
    "Progresion",
    scale(source.progressionEase),
    scale(candidate.progressionEase),
    "es mas facil de progresar de forma medible.",
    "es mas dificil de progresar: exige saltos mayores o cambiar de variante.",
  );
  if (progressionNote) {
    const isEasier =
      (candidate.progressionEase ?? 0) > (source.progressionEase ?? 0);
    (isEasier ? advantages : limitations).push(progressionNote);
  }

  const demandNote = describeScaleDifference(
    "Tecnica",
    scale(source.technicalDemand),
    scale(candidate.technicalDemand),
    "es tecnicamente mas exigente, con mas margen de error.",
    "es tecnicamente mas sencillo, se aprende antes.",
  );
  if (demandNote) {
    const isHarder =
      (candidate.technicalDemand ?? 0) > (source.technicalDemand ?? 0);
    (isHarder ? limitations : advantages).push(demandNote);
  }

  const fatigueNote = describeScaleDifference(
    "Fatiga",
    scale(source.systemicFatigue),
    scale(candidate.systemicFatigue),
    "deja mas fatiga acumulada y condiciona mas el resto de la sesion.",
    "deja menos fatiga, mas facil de encajar en una sesion cargada.",
  );
  if (fatigueNote) {
    const isMoreFatiguing =
      (candidate.systemicFatigue ?? 0) > (source.systemicFatigue ?? 0);
    (isMoreFatiguing ? limitations : advantages).push(fatigueNote);
  }

  const compatibility = computeCompatibility(source, candidate);

  return {
    compatibility,
    similarities,
    advantages,
    differences,
    limitations,
    recommendation: buildRecommendation(source, candidate, compatibility),
  };
}

function buildRecommendation(
  source: BiomechanicalExercise,
  candidate: BiomechanicalExercise,
  compatibility: number,
): string {
  const samePrimary = candidate.primaryMuscle === source.primaryMuscle;

  if (!samePrimary) {
    return `Trabaja otro musculo principal, asi que no sustituye a ${source.name}: uselo solo si quieres cambiar el enfoque de la sesion.`;
  }
  if (compatibility >= 8) {
    return `Sustituto muy cercano de ${source.name}: mismo musculo y estimulo parecido.`;
  }
  if (compatibility >= 6) {
    return `Sustituto razonable de ${source.name}, aunque el estimulo no es identico. Revisa las diferencias antes de cambiarlo.`;
  }
  return `Comparte el musculo principal con ${source.name}, pero el estimulo cambia bastante. Sirve como alternativa de emergencia.`;
}

/**
 * Compara y ordena varios candidatos. Devuelve los mejores primero para
 * poder ofrecer al menos tres alternativas razonables cuando existan.
 */
export function rankComparisons(
  source: BiomechanicalExercise,
  candidates: BiomechanicalExercise[],
  maxResults = 5,
): (ExerciseComparison & { exercise: BiomechanicalExercise })[] {
  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => ({
      exercise: candidate,
      ...compareExercises(source, candidate),
    }))
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, maxResults);
}
