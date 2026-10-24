/**
 * Consejo del copiloto en Inicio, por reglas y no por IA.
 *
 * Generarlo con Gemini cada vez que se abre Inicio gastaria la cuota gratuita
 * (20 consultas al dia) en algo que se lee de pasada. Con reglas cita solo
 * cifras reales del dia y no inventa nada. La primera regla que aplica gana;
 * si ninguna aplica, no hay consejo y la tarjeta no se muestra.
 */

export type InsightInput = {
  /** Hora local del usuario, 0–23. */
  hour: number;
  /** Kcal que suma a la meta el entreno de hoy (0 si no aplica). */
  extraKcal: number;
  /** «Dia B», del ajuste por entreno. */
  trainingDayName: string | null;
  /** Si el ajuste sale de un entreno ya hecho o del previsto. */
  trainingBasis: "hecho" | "previsto" | null;
  proteinGoalG: number | null;
  proteinConsumedG: number;
  waterTargetMl: number | null;
  waterMl: number;
  /** La siguiente comida pendiente del plan, con su hora «HH:MM». */
  nextMeal: { name: string; time: string | null } | null;
};

export type Insight = {
  text: string;
  /** Pregunta que se le pasa al copiloto al tocar «Preguntar algo». */
  ask: string;
};

const g = (n: number) => Math.round(n).toLocaleString("es-CR");
const l = (ml: number) =>
  (ml / 1000).toLocaleString("es-CR", { maximumFractionDigits: 2 });

function minutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export function homeInsight(input: InsightInput): Insight | null {
  const proteinLeft =
    input.proteinGoalG !== null
      ? input.proteinGoalG - input.proteinConsumedG
      : null;

  // 1. Ajuste por entreno: es lo que cambia la meta de hoy.
  if (input.extraKcal > 0) {
    const dia = input.trainingDayName ? ` (${input.trainingDayName})` : "";
    const verbo =
      input.trainingBasis === "hecho" ? "Entrenaste" : "Hoy entrenas";
    return {
      text: `${verbo}${dia}: tu meta de hoy sube ${g(input.extraKcal)} kcal para cubrir el gasto del entreno.`,
      ask: `¿Qué como para cubrir las ${g(input.extraKcal)} kcal extra del entreno de hoy?`,
    };
  }

  // 2. Comida atrasada: más de una hora tarde respecto al plan.
  if (input.nextMeal?.time) {
    const late = input.hour * 60 - minutes(input.nextMeal.time);
    if (late >= 60) {
      return {
        text: `${input.nextMeal.name} estaba para las ${input.nextMeal.time.slice(0, 5)} y sigue pendiente. Si ya comiste, márcala en Nutrición.`,
        ask: `Se me pasó ${input.nextMeal.name}. ¿Qué hago con el resto del día?`,
      };
    }
  }

  // 3. Proteína: desde media tarde, si falta más de un tercio de la meta.
  if (
    input.hour >= 15 &&
    proteinLeft !== null &&
    input.proteinGoalG !== null &&
    proteinLeft > input.proteinGoalG / 3
  ) {
    return {
      text: `Te faltan ${g(proteinLeft)} g de proteína para tu meta de ${g(input.proteinGoalG)} g. Repártelos en lo que queda del día.`,
      ask: `¿Qué como para sumar ${g(proteinLeft)} g de proteína hoy?`,
    };
  }

  // 4. Agua: desde media tarde, por debajo de la mitad de la meta.
  if (
    input.hour >= 15 &&
    input.waterTargetMl &&
    input.waterMl < input.waterTargetMl / 2
  ) {
    return {
      text: `Vas ${l(input.waterMl)} de ${l(input.waterTargetMl)} L de agua. Un vaso ahora te deja más cerca de la meta.`,
      ask: "¿Cuánta agua me conviene tomar hoy y por qué?",
    };
  }

  return null;
}
