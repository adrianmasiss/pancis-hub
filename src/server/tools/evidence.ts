import { createClient } from "@/lib/supabase/server";
import type { ToolSource } from "@/server/tools/types";

/**
 * Recuperacion de fuentes desde `research_sources` y `formula_versions`.
 *
 * Es lo que convierte al asistente en algo distinto de un chatbot de nutricion:
 * cuando dice "tu objetivo de proteina es X", puede decir de donde sale ese X,
 * con que grado de evidencia y sobre que poblacion se estudio.
 *
 * `_old-docs-2026-07-27/06-chat-ia.md` pide busqueda DIRIGIDA y no mandar la
 * biblioteca entera en cada llamada, por coste de tokens. Por eso se consulta
 * por clave de formula o por tema, nunca todo.
 *
 * SERVER-ONLY.
 */

type SourceRow = {
  title: string;
  year: number | null;
  doi: string | null;
  pmid: string | null;
  evidence_grade: string | null;
  population: string | null;
  limitations: string | null;
  is_retracted: boolean;
};

/** Vinculo entre una constante y una fuente, con el matiz del revisor. */
type SourceLink = { role: string | null; note: string | null };

function toToolSource(
  row: SourceRow,
  isProductParameter: boolean,
  link?: SourceLink,
): ToolSource {
  return {
    title: row.title,
    year: row.year,
    identifier: row.pmid ? `PMID ${row.pmid}` : row.doi ? `DOI ${row.doi}` : null,
    evidenceGrade: (row.evidence_grade as ToolSource["evidenceGrade"]) ?? null,
    population: row.population,
    limitations: row.limitations,
    role: link?.role ?? null,
    note: link?.note ?? null,
    isProductParameter,
  };
}

/**
 * Fuentes que sostienen una constante concreta, por su clave en
 * `formula_versions` (por ejemplo `protein_ranges`).
 *
 * Excluye las retractadas: `04_SCIENTIFIC_GOVERNANCE` prohibe citarlas, y es
 * mejor no decir nada que citar algo retirado.
 */
export async function getSourcesForFormula(
  key: string,
): Promise<{ sources: ToolSource[]; rationale: string | null; limitations: string | null }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("formula_versions")
      .select(
        "rationale, limitations, is_product_parameter, formula_version_sources(role, note, research_sources(title, year, doi, pmid, evidence_grade, population, limitations, is_retracted))",
      )
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) return { sources: [], rationale: null, limitations: null };

    /*
     * El `role` y la `note` del vinculo VIAJAN. Se consultaban y se tiraban, y
     * eso invertia el sentido de las fuentes: Morton 2018 entra en el rango de
     * proteina con role `matiza` porque su corte de 1.62 g/kg no es
     * significativo, pero sin ese dato aparecia junto a las demas como si lo
     * sustentara. Es el matiz que costo leer el texto completo en la fase 2.
     */
    const sources = (data.formula_version_sources ?? [])
      .map((link) => ({
        row: link.research_sources,
        role: link.role as string | null,
        note: link.note as string | null,
      }))
      .filter(
        (entry): entry is { row: SourceRow } & SourceLink =>
          entry.row !== null && !entry.row.is_retracted,
      )
      .map((entry) =>
        toToolSource(entry.row, data.is_product_parameter, entry),
      );

    return {
      sources,
      rationale: data.rationale,
      limitations: data.limitations,
    };
  } catch {
    // Sin fuentes el asistente sigue funcionando: simplemente no cita. Es
    // preferible a tumbar la respuesta entera (RF-015).
    return { sources: [], rationale: null, limitations: null };
  }
}

/** Etiquetas legibles de cada constante, para explicarlas al usuario. */
const FORMULA_LABELS: Record<string, string> = {
  bmr_equation: "La formula con la que estimamos tu gasto en reposo",
  activity_factors: "El factor con el que ajustamos por tu actividad",
  goal_adjustments: "El ajuste que aplicamos por tu objetivo",
  safety_floor_factor: "El suelo por debajo del cual no bajamos tus calorias",
  macro_tolerances_pct: "Cuanto puede desviarse un cambio sin avisarte",
  compatibility_profiles: "Como puntuamos si dos alimentos se parecen",
  protein_ranges: "Tu rango de proteina",
  weekly_rate_band_percent: "El ritmo de cambio de peso que buscamos",
  min_fat_g_per_kg: "Tu minimo de grasa",
  fiber_g_per_1000_kcal: "Tu objetivo de fibra",
  water_ml_per_kg: "La referencia de agua",
  energy_availability_thresholds: "El minimo de energia disponible",
  rir_by_goal: "Las repeticiones en reserva que te sugerimos",
  min_rest_seconds: "El descanso minimo entre series",
  weekly_set_ranges: "Los rangos de series por semana",
  tempo_very_slow_seconds: "El limite de lentitud por repeticion",
  frequency_is_distribution: "Como tratamos la frecuencia",
  bia_individual_error: "El margen de error de la bioimpedancia",
};

/**
 * Valor legible: un numero, un rango o una tabla por objetivo.
 *
 * `preferKey` es el objetivo del usuario. Cuando el valor es una tabla, se
 * devuelve SOLO su fila: a quien pregunta por su proteina no le sirve leer los
 * cuatro objetivos, le sirve el suyo.
 */
export function formatValue(value: unknown, preferKey?: string | null): string {
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (preferKey && preferKey in record) return formatValue(record[preferKey]);
    const entries = Object.entries(value as Record<string, unknown>);
    const isRange =
      entries.length === 2 && "min" in (value as object) && "max" in (value as object);
    if (isRange) {
      const v = value as { min: number; max: number };
      return `${v.min} a ${v.max}`;
    }
    return entries
      .map(([k, v]) =>
        v && typeof v === "object" && "min" in (v as object)
          ? `${k} ${(v as { min: number; max: number }).min} a ${(v as { min: number; max: number }).max}`
          : `${k} ${String(v)}`,
      )
      .join(", ");
  }
  return "";
}

export type FormulaExplanation = {
  label: string;
  value: string;
  rationale: string;
  limitations: string | null;
  isProductParameter: boolean;
};

/**
 * Explicacion completa de una constante, para responder "por que ese numero"
 * SIN IA. El texto viene de la justificacion revisada al aprobar el claim, no
 * se genera cada vez.
 */
export async function getFormulaExplanation(
  key: string,
  /** Objetivo del usuario, para recortar las tablas por objetivo a su fila. */
  goal?: string | null,
): Promise<FormulaExplanation | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("formula_versions")
      .select("value, unit, rationale, limitations, is_product_parameter")
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle();

    if (!data?.rationale) return null;

    const value = formatValue(data.value, goal);
    return {
      label: FORMULA_LABELS[key] ?? "Esta cifra",
      value: data.unit ? `${value} ${data.unit}` : value,
      rationale: data.rationale,
      limitations: data.limitations,
      isProductParameter: data.is_product_parameter,
    };
  } catch {
    return null;
  }
}

/**
 * Busqueda por tema, para preguntas abiertas. Busca en titulo y poblacion.
 *
 * Deliberadamente acotada: devuelve pocas fuentes porque van al contexto del
 * modelo y cada una cuesta tokens.
 */
export async function searchEvidence(
  query: string,
  limit = 4,
): Promise<ToolSource[]> {
  const term = query.trim();
  if (term.length < 3) return [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("research_sources")
      .select(
        "title, year, doi, pmid, evidence_grade, population, limitations, is_retracted",
      )
      .or(`title.ilike.%${term}%,population.ilike.%${term}%`)
      .eq("is_retracted", false)
      // Las guias y revisiones primero: es la jerarquia del doc 04.
      .order("evidence_grade", { ascending: true })
      .limit(limit);

    return (data ?? []).map((row) => toToolSource(row as SourceRow, false));
  } catch {
    return [];
  }
}

/**
 * Resume las fuentes en texto plano para inyectarlo en el contexto del modelo.
 *
 * Incluye poblacion y limitaciones a proposito: si el modelo va a explicar una
 * cifra, tiene que poder decir sobre quien se estudio. Es la diferencia entre
 * "necesitas 2 g/kg" y "en adultos que entrenan fuerza, mayormente hombres
 * jovenes, se observo que...".
 *
 * Y con el papel de cada fuente, para que no pueda citar como apoyo algo que
 * en el registro esta marcado como matiz.
 */
export function formatSourcesForPrompt(sources: ToolSource[]): string {
  if (sources.length === 0) return "";

  return sources
    .map((source) => {
      const partes = [
        `- ${source.title}${source.year ? ` (${source.year})` : ""}`,
        source.identifier ? `  ${source.identifier}` : null,
        source.evidenceGrade ? `  Nivel de evidencia: ${source.evidenceGrade}` : null,
        source.population ? `  Poblacion: ${source.population}` : null,
        source.limitations ? `  Limitaciones: ${source.limitations}` : null,
        source.role ? `  Papel en esta cifra: ${source.role}` : null,
        source.note ? `  Nota del revisor: ${source.note}` : null,
        source.isProductParameter
          ? "  ATENCION: es un parametro de producto, no una afirmacion cientifica."
          : null,
      ];
      return partes.filter(Boolean).join("\n");
    })
    .join("\n");
}
