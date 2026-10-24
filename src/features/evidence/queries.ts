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
  /** Los lomos del anillo: una muestra con regla, no la biblioteca entera. */
  spines: EvidenceSpine[];
};

export type EvidenceSpine = {
  id: string;
  /** 1 evidencia, 2 interpretacion, 3 inferencia personalizada. */
  layer: 1 | 2 | 3;
  title: string;
  meta: string;
  /** 1 a 5. La certeza baja al acercarse a ti, que es la tesis de la pantalla. */
  confidence: number;
};

/** Grado de evidencia a certeza de 1 a 5. Sin grado, no se afirma nada alto. */
const GRADE_CONFIDENCE: Record<string, number> = { A: 5, B: 4, C: 3, D: 2 };

/**
 * Los siete lomos del anillo.
 *
 * El anillo NO puede mostrar las 41 entradas: es el resumen, y las tablas de
 * debajo son la biblioteca completa. Asi que hace falta una regla de seleccion,
 * y la regla es objetiva y esta escrita aqui para que nadie la confunda con
 * gusto: **los tres de mayor grado de cada una de las dos primeras capas, y tus
 * numeros al final**. Empatados, gana el mas reciente.
 *
 * Que sean tres y tres y uno no es capricho: hace que las tres capas aparezcan
 * siempre en el anillo. Con "los siete mas fuertes" a secas, la capa de
 * interpretacion podia no salir nunca.
 */
function buildSpines(
  studies: EvidenceStudy[],
  constants: EvidenceConstant[],
  personal: PersonalInference,
): EvidenceSpine[] {
  const byGrade = (grade: string | null) =>
    grade ? (GRADE_CONFIDENCE[grade] ?? 1) : 1;

  const topStudies = [...studies]
    .sort(
      (a, b) =>
        byGrade(b.evidenceGrade) - byGrade(a.evidenceGrade) ||
        (b.year ?? 0) - (a.year ?? 0),
    )
    .slice(0, 3)
    .map<EvidenceSpine>((study) => ({
      id: study.id,
      layer: 1,
      title: study.title,
      meta: [study.year, study.journal].filter(Boolean).join(" · "),
      confidence: byGrade(study.evidenceGrade),
    }));

  const topConstants = constants
    // Un criterio del producto no es una lectura de la evidencia: no entra a
    // representar esta capa.
    .filter((constant) => !constant.isProductParameter)
    .sort((a, b) => byGrade(b.evidenceGrade) - byGrade(a.evidenceGrade))
    .slice(0, 3)
    .map<EvidenceSpine>((constant) => ({
      id: constant.id,
      layer: 2,
      title: constant.key,
      meta:
        constant.sources.length > 0
          ? `${constant.sources.length} fuentes`
          : "sin fuentes",
      // Una lectura nunca es mas cierta que la evidencia que la sostiene.
      confidence: Math.max(1, byGrade(constant.evidenceGrade) - 1),
    }));

  const mine: EvidenceSpine[] = personal
    ? [
        {
          id: "personal",
          layer: 3,
          title: `${Math.round(personal.calories)} kcal`,
          meta: `desde ${personal.effectiveFrom}`,
          // La capa mas cercana y la mas incierta: se afirma lo menos.
          confidence: 2,
        },
      ]
    : [];

  return [...topStudies, ...topConstants, ...mine];
}

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

  const personal: PersonalInference = target
    ? {
        effectiveFrom: target.effective_from,
        calories: target.calories,
        proteinG: target.protein_g,
        carbohydrateG: target.carbohydrate_g,
        fatG: target.fat_g,
        fiberG: target.fiber_g,
      }
    : null;

  return {
    studies,
    constants,
    personal,
    spines: buildSpines(studies, constants, personal),
  };
}

/**
 * Una fuente lista para leer en el telefono: los datos de siempre mas tema,
 * resumen, puntos clave y texto, que llegan cuando el usuario carga sus
 * articulos. Mientras no esten, valen null y la vista lo dice.
 */
export type EvidenceArticle = EvidenceStudy & {
  url: string | null;
  doi: string | null;
  pmid: string | null;
  topic: string | null;
  summary: string | null;
  keyPoints: string[];
  body: string | null;
};

export async function getEvidenceArticles(): Promise<EvidenceArticle[]> {
  const supabase = await createClient();
  // `*` y no la lista de columnas: asi la pantalla sigue andando en una base
  // que todavia no tiene la migracion de tema/resumen/texto.
  const { data } = await supabase
    .from("research_sources")
    .select("*")
    .eq("is_retracted", false)
    .order("year", { ascending: false, nullsFirst: false });

  return (data ?? []).map((row) => ({
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
    url: row.url,
    doi: row.doi,
    pmid: row.pmid,
    topic: row.topic ?? null,
    summary: row.summary ?? null,
    keyPoints: row.key_points ?? [],
    body: row.body ?? null,
  }));
}
