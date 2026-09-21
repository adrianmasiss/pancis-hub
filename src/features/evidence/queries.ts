import { createClient } from "@/lib/supabase/server";

/**
 * La biblioteca de evidencia completa, para la pantalla de Evidencia.
 *
 * `src/server/tools/evidence.ts` consulta DIRIGIDO —por clave de formula o por
 * tema— porque lo que lee acaba en el prompt del modelo y la biblioteca entera
 * costaria tokens en cada llamada. Aqui es al contrario: esto se rinde en el
 * servidor y nunca entra en un prompt, asi que traerla completa es lo correcto
 * y no contradice esa regla.
 *
 * Las retractadas se excluyen siempre: `04_SCIENTIFIC_GOVERNANCE` prohibe
 * citarlas, y es mejor no decir nada que citar algo retirado.
 *
 * SERVER-ONLY.
 */

export type EvidenceStudy = {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  journal: string | null;
  /** `PMID 12345678` o `DOI 10.xxxx`, lo que haya. */
  identifier: string | null;
  sourceType: string;
  evidenceGrade: string | null;
  population: string | null;
  limitations: string | null;
  isOpenAccess: boolean;
};

export type EvidenceConstantSource = {
  title: string;
  year: number | null;
  /** `sustenta`, `matiza` o `contradice`. */
  role: string;
  note: string | null;
  evidenceGrade: string | null;
};

export type EvidenceConstant = {
  id: string;
  key: string;
  value: unknown;
  unit: string | null;
  evidenceGrade: string | null;
  /** true cuando es criterio de la app y NO una lectura de la evidencia. */
  isProductParameter: boolean;
  rationale: string | null;
  limitations: string | null;
  sources: EvidenceConstantSource[];
};

export type PersonalInference = {
  effectiveFrom: string;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
} | null;

export type EvidenceLibrary = {
  studies: EvidenceStudy[];
  constants: EvidenceConstant[];
  personal: PersonalInference;
};

function identifierOf(pmid: string | null, doi: string | null): string | null {
  if (pmid) return `PMID ${pmid}`;
  if (doi) return `DOI ${doi}`;
  return null;
}

export async function getEvidenceLibrary(
  userId: string,
): Promise<EvidenceLibrary> {
  const supabase = await createClient();

  const [studiesResult, constantsResult, targetsResult] = await Promise.all([
    supabase
      .from("research_sources")
      .select(
        "id, title, authors, year, journal, doi, pmid, source_type, evidence_grade, population, limitations, is_open_access",
      )
      .eq("is_retracted", false)
      .order("year", { ascending: false, nullsFirst: false }),
    supabase
      .from("formula_versions")
      .select(
        "id, key, value, unit, evidence_grade, is_product_parameter, rationale, limitations, formula_version_sources(role, note, research_sources(title, year, evidence_grade, is_retracted))",
      )
      .eq("is_active", true)
      .order("is_product_parameter", { ascending: true })
      .order("key", { ascending: true }),
    supabase
      .from("nutrition_targets")
      .select(
        "effective_from, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const studies: EvidenceStudy[] = (studiesResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    authors: row.authors,
    year: row.year,
    journal: row.journal,
    identifier: identifierOf(row.pmid, row.doi),
    sourceType: row.source_type,
    evidenceGrade: row.evidence_grade,
    population: row.population,
    limitations: row.limitations,
    isOpenAccess: row.is_open_access,
  }));

  const constants: EvidenceConstant[] = (constantsResult.data ?? []).map(
    (row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      unit: row.unit,
      evidenceGrade: row.evidence_grade,
      isProductParameter: row.is_product_parameter,
      rationale: row.rationale,
      limitations: row.limitations,
      sources: (row.formula_version_sources ?? [])
        // Una fuente retractada no se cita ni aqui.
        .filter((link) => link.research_sources?.is_retracted === false)
        .map((link) => ({
          title: link.research_sources!.title,
          year: link.research_sources!.year,
          role: link.role,
          note: link.note,
          evidenceGrade: link.research_sources!.evidence_grade,
        })),
    }),
  );

  const target = targetsResult.data;

  return {
    studies,
    constants,
    personal: target
      ? {
          effectiveFrom: target.effective_from,
          calories: target.calories,
          proteinG: target.protein_g,
          carbohydrateG: target.carbohydrate_g,
          fatG: target.fat_g,
          fiberG: target.fiber_g,
        }
      : null,
  };
}
