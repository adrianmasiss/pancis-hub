/**
 * Sustitutos de un ejercicio para UNA sesión: qué tan parecido es cada
 * candidato al original, en porcentaje y en músculos.
 *
 * El parecido se mide por lo que el ejercicio trabaja, que es lo que se
 * quiere conservar al cambiarlo: el principal pesa el doble que cada
 * secundario. Patrón de movimiento y equipo no suman al porcentaje (un remo
 * con mancuerna y uno en polea trabajan lo mismo), pero desempatan al
 * ordenar: a igual parecido, el que se mueve igual va antes.
 */
import type { CatalogExercise } from "./alternatives";

export type SubstituteCandidate = Pick<
  CatalogExercise,
  | "id"
  | "name"
  | "primaryMuscle"
  | "secondaryMuscles"
  | "movementPattern"
  | "equipment"
>;

export type SubstituteMatch<
  T extends SubstituteCandidate = SubstituteCandidate,
> = {
  exercise: T;
  /** 0–100. */
  similarity: number;
  /** Músculos que trabajan los dos. */
  shared: string[];
  /** Los del original que el sustituto ya no trabaja. */
  lost: string[];
  /** Los que el sustituto suma y el original no. */
  added: string[];
};

const PESO_PRINCIPAL = 2;
const PESO_SECUNDARIO = 1;

function pesos(e: SubstituteCandidate): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const m of e.secondaryMuscles) mapa.set(m, PESO_SECUNDARIO);
  mapa.set(e.primaryMuscle, PESO_PRINCIPAL);
  return mapa;
}

/**
 * Jaccard ponderado: lo que comparten (el menor de los dos pesos) sobre todo
 * lo que trabaja cualquiera de los dos (el mayor).
 */
export function compareMuscles<T extends SubstituteCandidate>(
  source: SubstituteCandidate,
  candidate: T,
): SubstituteMatch<T> {
  const a = pesos(source);
  const b = pesos(candidate);
  let comun = 0;
  let total = 0;
  for (const m of new Set([...a.keys(), ...b.keys()])) {
    const pa = a.get(m) ?? 0;
    const pb = b.get(m) ?? 0;
    comun += Math.min(pa, pb);
    total += Math.max(pa, pb);
  }
  return {
    exercise: candidate,
    similarity: total ? Math.round((comun / total) * 100) : 0,
    shared: [...a.keys()].filter((m) => b.has(m)),
    lost: [...a.keys()].filter((m) => !b.has(m)),
    added: [...b.keys()].filter((m) => !a.has(m)),
  };
}

function desempate(source: SubstituteCandidate, c: SubstituteCandidate) {
  return (
    (source.movementPattern && c.movementPattern === source.movementPattern
      ? 2
      : 0) + (c.equipment === source.equipment ? 1 : 0)
  );
}

/**
 * Ordena candidatos por parecido. Nunca incluye el propio original ni otro
 * con su mismo nombre, y no repite nombres: el catálogo trae algunos dos
 * veces (curado e importado).
 */
/**
 * Movimientos olimpicos, balisticos o de lanzamiento. Comparten musculos con
 * una bisagra o una sentadilla, pero no se cambian por ellos a mitad de una
 * sesion: con el catalogo importado (sin patron de movimiento) el motor
 * proponia un «Kettlebell Clean» para el peso muerto.
 */
const BALISTICO =
  /\b(?:clean|snatch|jerk|swing|throw|toss|slam|jump|hop|bound|cargada|arranque|envi?on|lanzamiento|salto)s?\b/i;

/** Un estiramiento nombra el musculo, pero no sustituye a un ejercicio. */
const ESTIRAMIENTO = /\b(?:stretch|estiramiento|estirar)\w*/i;

export function rankSubstitutes<T extends SubstituteCandidate>(
  source: SubstituteCandidate,
  candidates: readonly T[],
  {
    limit = 8,
    minSimilarity = 1,
  }: { limit?: number; minSimilarity?: number } = {},
): SubstituteMatch<T>[] {
  const nombres = new Set([source.name.toLowerCase()]);
  const fuenteBalistica = BALISTICO.test(source.name);
  const fuenteEstiramiento = ESTIRAMIENTO.test(source.name);
  return candidates
    .filter((c) => {
      const nombre = c.name.toLowerCase();
      if (c.id === source.id || nombres.has(nombre)) return false;
      if (!fuenteBalistica && BALISTICO.test(c.name)) return false;
      if (!fuenteEstiramiento && ESTIRAMIENTO.test(c.name)) return false;
      nombres.add(nombre);
      return true;
    })
    .map((c) => ({
      match: compareMuscles(source, c),
      tie: desempate(source, c),
    }))
    .filter(({ match }) => match.similarity >= minSimilarity)
    .sort(
      (x, y) =>
        y.match.similarity - x.match.similarity ||
        y.tie - x.tie ||
        x.match.exercise.name.localeCompare(y.match.exercise.name),
    )
    .slice(0, limit)
    .map(({ match }) => match);
}
