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

function toToolSource(row: SourceRow, isProductParameter: boolean): ToolSource {
  return {
    title: row.title,
    year: row.year,
    identifier: row.pmid ? `PMID ${row.pmid}` : row.doi ? `DOI ${row.doi}` : null,
    evidenceGrade: (row.evidence_grade as ToolSource["evidenceGrade"]) ?? null,
    population: row.population,
    limitations: row.limitations,
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

    const sources = (data.formula_version_sources ?? [])
      .map((link) => link.research_sources)
      .filter((row): row is SourceRow => row !== null && !row.is_retracted)
      .map((row) => toToolSource(row, data.is_product_parameter));

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
        source.isProductParameter
          ? "  ATENCION: es un parametro de producto, no una afirmacion cientifica."
          : null,
      ];
      return partes.filter(Boolean).join("\n");
    })
    .join("\n");
}
