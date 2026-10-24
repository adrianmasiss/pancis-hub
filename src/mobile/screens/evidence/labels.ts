import { messages } from "@/i18n/es-419";

/** Los temas de `research_sources.topic`, en el orden en que se filtran. */
export const TOPICS = [
  { id: "nutricion", label: "Nutrición" },
  { id: "entrenamiento", label: "Entrenamiento" },
  { id: "recomposicion", label: "Recomposición" },
  { id: "suplementacion", label: "Suplementación" },
  { id: "salud", label: "Salud" },
] as const;

const TIPOS: Record<string, string> = {
  metaanalisis: "Metaanálisis",
  revision_sistematica: "Revisión sistemática",
  ensayo_controlado: "Ensayo controlado",
  guia_oficial: "Guía oficial",
  estudio_longitudinal: "Estudio longitudinal",
  estudio_agudo: "Estudio agudo",
  opinion_experta: "Opinión experta",
  normativa: "Normativa",
};

export function sourceTypeLabel(type: string): string {
  return TIPOS[type] ?? messages.evidence.sourceTypes[type] ?? type;
}

/** Enlace a la fuente original: la URL guardada, el DOI o PubMed. */
export function originalUrl(a: {
  url: string | null;
  doi: string | null;
  pmid: string | null;
}): string | null {
  if (a.url) return a.url;
  if (a.doi) return `https://doi.org/${a.doi}`;
  if (a.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`;
  return null;
}
