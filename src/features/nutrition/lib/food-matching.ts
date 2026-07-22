/**
 * Emparejamiento de nombres de alimentos.
 *
 * La logica es generica y vive en `@/lib/name-matching`, porque el
 * importador de rutinas la necesita igual para los ejercicios. Este
 * modulo se conserva como punto de entrada del dominio de alimentos.
 */
export {
  normalizeName as normalizeFoodName,
  singularize,
  significantTokens,
  nameSimilarity,
  pickBestMatch,
  MIN_MATCH_SCORE,
  type MatchCandidate,
  type ScoredMatch,
} from "@/lib/name-matching";
