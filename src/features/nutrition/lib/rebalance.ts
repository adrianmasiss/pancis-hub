/**
 * Reajuste del resto del dia (docs/02_PRODUCT_REQUIREMENTS.md 6).
 *
 * Cuando el usuario cambia un alimento, el dia deja de cuadrar. Este
 * modulo calcula lo que queda y redacta sugerencias concretas y
 * priorizadas sobre las comidas que AUN no se han consumido.
 *
 * Reglas que no se rompen:
 * - Nunca modifica nada: solo describe que haria. Aplicar un cambio es
 *   siempre una accion explicita del usuario.
 * - No inventa alimentos ni cantidades exactas que no pueda justificar;
 *   habla en terminos de subir/bajar el aporte de un macro.
 * - Si quedan pocas comidas por delante, lo dice en vez de repartir un
 *   ajuste imposible.
 */
import type { MacroSet } from "@/features/nutrition/lib/macros";

export type RebalanceSeverity = "alta" | "media" | "informativa";

export type RebalanceSuggestion = {
  /** Macro al que apunta la sugerencia; null si es un mensaje general. */
  macro: keyof MacroSet | null;
  severity: RebalanceSeverity;
  /** Diferencia respecto al objetivo: positivo = sobra, negativo = falta. */
  deviation: number;
  message: string;
};

export type RebalanceInput = {
  /** Objetivo diario del usuario. */
  target: MacroSet;
  /** Lo ya consumido hoy, incluido el cambio recien aplicado. */
  consumed: MacroSet;
  /** Comidas del dia que siguen pendientes. */
  pendingMeals: number;
};

export type RebalanceReport = {
  remaining: MacroSet;
  suggestions: RebalanceSuggestion[];
};

/**
 * Umbrales de desviacion para considerar que un macro merece un ajuste.
 * Por debajo de esto, la diferencia cabe dentro del margen de error de
 * pesar y estimar alimentos, y avisar seria ruido.
 */
const THRESHOLDS = {
  calories: { medium: 100, high: 250 },
  proteinG: { medium: 10, high: 25 },
  carbohydrateG: { medium: 15, high: 40 },
  fatG: { medium: 8, high: 20 },
  fiberG: { medium: 6, high: 12 },
} as const;

const MACRO_NAMES: Record<keyof MacroSet, string> = {
  calories: "calorias",
  proteinG: "proteina",
  carbohydrateG: "carbohidratos",
  fatG: "grasas",
  fiberG: "fibra",
};

const UNITS: Record<keyof MacroSet, string> = {
  calories: "kcal",
  proteinG: "g",
  carbohydrateG: "g",
  fatG: "g",
  fiberG: "g",
};

const round1 = (value: number) => Math.round(value * 10) / 10;

function severityFor(
  macro: keyof MacroSet,
  deviation: number,
): RebalanceSeverity | null {
  const magnitude = Math.abs(deviation);
  const threshold = THRESHOLDS[macro];
  if (magnitude >= threshold.high) return "alta";
  if (magnitude >= threshold.medium) return "media";
  return null;
}

/**
 * Redacta la sugerencia. El texto distingue entre "te sobra" y "te falta"
 * y se apoya en las comidas pendientes, porque el consejo cambia por
 * completo si ya no queda ninguna.
 */
function messageFor(
  macro: keyof MacroSet,
  deviation: number,
  pendingMeals: number,
): string {
  const name = MACRO_NAMES[macro];
  const unit = UNITS[macro];
  const amount = `${Math.abs(round1(deviation))} ${unit}`;

  if (deviation > 0) {
    // Sobra margen: falta por consumir.
    if (pendingMeals === 0) {
      return `Te faltaron ${amount} de ${name} y ya no quedan comidas planificadas. Considera un snack o ajusta el objetivo de manana.`;
    }
    return macro === "proteinG"
      ? `Te faltan ${amount} de ${name}. Prioriza una fuente magra de proteina en las ${pendingMeals} comidas que te quedan.`
      : `Te faltan ${amount} de ${name}. Puedes repartirlos entre las ${pendingMeals} comidas que te quedan.`;
  }

  // Deficit negativo: se paso del objetivo.
  if (pendingMeals === 0) {
    return `Te pasaste por ${amount} de ${name} y ya no quedan comidas pendientes. Tenlo en cuenta manana, sin compensar de golpe.`;
  }
  return `Te pasaste por ${amount} de ${name}. Reduce esa fuente en las ${pendingMeals} comidas que te quedan.`;
}

/** Orden de prioridad para mostrar: primero lo mas grave. */
const SEVERITY_ORDER: Record<RebalanceSeverity, number> = {
  alta: 0,
  media: 1,
  informativa: 2,
};

/**
 * La proteina se atiende antes que el resto a igualdad de severidad:
 * es el macro con mayor impacto en la recomposicion corporal.
 */
const MACRO_PRIORITY: (keyof MacroSet)[] = [
  "proteinG",
  "calories",
  "carbohydrateG",
  "fatG",
  "fiberG",
];

export function rebalanceDay({
  target,
  consumed,
  pendingMeals,
}: RebalanceInput): RebalanceReport {
  const remaining: MacroSet = {
    calories: Math.round(target.calories - consumed.calories),
    proteinG: round1(target.proteinG - consumed.proteinG),
    carbohydrateG: round1(target.carbohydrateG - consumed.carbohydrateG),
    fatG: round1(target.fatG - consumed.fatG),
    fiberG: round1(target.fiberG - consumed.fiberG),
  };

  const suggestions: RebalanceSuggestion[] = [];

  for (const macro of MACRO_PRIORITY) {
    const deviation = remaining[macro];
    const severity = severityFor(macro, deviation);
    if (!severity) continue;
    suggestions.push({
      macro,
      severity,
      deviation,
      message: messageFor(macro, deviation, pendingMeals),
    });
  }

  suggestions.sort((a, b) => {
    const bySeverity =
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return (
      MACRO_PRIORITY.indexOf(a.macro as keyof MacroSet) -
      MACRO_PRIORITY.indexOf(b.macro as keyof MacroSet)
    );
  });

  // Sin desviaciones relevantes se confirma explicitamente que el dia
  // sigue cuadrando: el silencio no comunica lo mismo.
  if (suggestions.length === 0) {
    suggestions.push({
      macro: null,
      severity: "informativa",
      deviation: 0,
      message:
        pendingMeals > 0
          ? `El dia sigue cuadrando con tu objetivo. Continua con las ${pendingMeals} comidas que te quedan.`
          : "El dia cerro dentro de tu objetivo.",
    });
  }

  return { remaining, suggestions };
}
