/**
 * Que fuentes cientificas hacen falta para responder a este mensaje.
 *
 * `_old-docs-2026-07-27/06-chat-ia.md` es explicito: no se manda la biblioteca
 * entera en cada llamada, sino una busqueda DIRIGIDA segun el tema. Mandar
 * todo seria carisimo en tokens y en cuota, que es el cuello de botella real
 * del plan gratuito de Gemini.
 *
 * La deteccion es deterministica a proposito: es barata, es testeable, y no
 * gasta una llamada al modelo para decidir que contexto darle al modelo.
 */

/** Claves de `formula_versions` que el asistente puede necesitar citar. */
export type FormulaKey =
  | "bmr_equation"
  | "activity_factors"
  | "protein_ranges"
  | "weekly_rate_band_percent"
  | "min_fat_g_per_kg"
  | "fiber_g_per_1000_kcal"
  | "water_ml_per_kg"
  | "energy_availability_thresholds"
  | "rir_by_goal"
  | "min_rest_seconds"
  | "weekly_set_ranges"
  | "tempo_very_slow_seconds"
  | "frequency_is_distribution"
  | "bia_individual_error";

/**
 * Terminos que activan cada clave. Van sin tildes porque el mensaje se
 * normaliza antes de comparar.
 */
const TRIGGERS: Record<FormulaKey, string[]> = {
  bmr_equation: ["metabolismo", "basal", "gasto en reposo", "tmb"],
  activity_factors: ["actividad", "sedentario", "gasto", "tdee", "cuantas calorias"],
  protein_ranges: ["proteina", "proteinas", "gramos de proteina"],
  weekly_rate_band_percent: [
    "deficit", "bajar de peso", "perder grasa", "adelgazar", "superavit", "subir de peso",
  ],
  min_fat_g_per_kg: ["grasa", "grasas", "testosterona"],
  fiber_g_per_1000_kcal: ["fibra"],
  water_ml_per_kg: ["agua", "hidratacion", "tomar agua"],
  energy_availability_thresholds: [
    "comer poco", "muy poco", "pocas calorias", "disponibilidad energetica", "hambre constante",
  ],
  rir_by_goal: ["rir", "fallo", "al fallo", "rpe", "cuanto apretar"],
  min_rest_seconds: ["descanso", "descansar", "entre series"],
  weekly_set_ranges: ["volumen", "series", "cuantas series"],
  tempo_very_slow_seconds: ["tempo", "cadencia", "velocidad de la repeticion", "lento"],
  frequency_is_distribution: ["frecuencia", "veces por semana", "cuantos dias"],
  bia_individual_error: ["inbody", "bioimpedancia", "grasa corporal", "masa magra", "bascula"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Claves relevantes para el mensaje, como mucho `max`.
 *
 * El tope existe por coste: cada fuente que entra al contexto son tokens, y
 * una pregunta que toque cinco temas no necesita cinco bibliografias para
 * responderse bien.
 */
export function detectRelevantFormulas(
  message: string,
  max = 3,
): FormulaKey[] {
  const text = normalize(message);
  if (text.trim().length === 0) return [];

  const scored: { key: FormulaKey; hits: number; earliest: number }[] = [];

  for (const [key, triggers] of Object.entries(TRIGGERS) as [
    FormulaKey,
    string[],
  ][]) {
    let hits = 0;
    let earliest = Number.POSITIVE_INFINITY;

    for (const trigger of triggers) {
      const at = text.indexOf(normalize(trigger));
      if (at !== -1) {
        hits += 1;
        earliest = Math.min(earliest, at);
      }
    }

    if (hits > 0) scored.push({ key, hits, earliest });
  }

  return scored
    .sort((a, b) =>
      // Mas coincidencias primero; a igualdad, lo que el usuario menciono antes.
      b.hits !== a.hits ? b.hits - a.hits : a.earliest - b.earliest,
    )
    .slice(0, max)
    .map((entry) => entry.key);
}
