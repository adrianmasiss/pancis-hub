/**
 * Qué dijo cada fuente del mismo alimento, y si se ponen de acuerdo.
 *
 * El catálogo no promedia. Cuando dos proveedores describen el mismo alimento,
 * `foods` conserva el valor de la fuente más fiable y `food_source_values`
 * guarda lo que dijo cada una. Un promedio sería un valor que no aparece en
 * ningún informe, y a «¿de dónde sale este número?» habría que responder «de
 * una media entre un laboratorio y algo que alguien tecleó en el móvil».
 *
 * Aquí vive la lectura de eso: convertir las mediciones guardadas en algo que
 * una persona pueda juzgar de un vistazo —corroborado o a revisar— y, cuando
 * discrepan, en qué macronutriente concreto.
 */

import type { ProviderSource } from "@/lib/food-providers/types";

/** Lo que una fuente dice de un alimento, siempre por 100 g. */
export type SourceReading = {
  source: ProviderSource;
  /** Identificador en el proveedor: con la fuente, señala esta medición. */
  externalId: string;
  externalName: string | null;
  calories: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fiberG: number | null;
};

export type SourceAgreement = {
  /** Mediciones guardadas, la canónica primero. */
  readings: SourceReading[];
  /** La fuente del valor que el catálogo muestra. */
  canonical: ProviderSource | null;
  /** Mayor desacuerdo relativo entre fuentes, en por ciento. */
  maxDivergencePct: number | null;
};

/**
 * Por encima de esto, dos fuentes no se parecen y hay que mirar.
 *
 * El mismo umbral que usa `scripts/sembrar-alimentos.mjs` al sembrar. Está
 * repetido porque el script es un `.mjs` que corre fuera de la aplicación y no
 * puede importar TypeScript; si uno cambia, el otro tiene que cambiar. Lo que
 * se guarda en la base es el PORCENTAJE, no un booleano, justamente para que
 * mover este número no obligue a volver a sembrar nada.
 */
export const DIVERGENCE_THRESHOLD = 15;

const NOMBRES: Record<ProviderSource, string> = {
  usda: "USDA",
  openfoodfacts: "Open Food Facts",
  dietly: "Dietly",
};

export function sourceName(source: ProviderSource): string {
  return NOMBRES[source] ?? source;
}

/** Enumera fuentes en prosa: «USDA», «USDA y Dietly», «USDA, Dietly y …». */
export function listSources(sources: ProviderSource[]): string {
  const nombres = sources.map(sourceName);
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

/**
 * Cómo nombrar una medición cuando hay que elegir entre varias.
 *
 * Un alimento puede tener dos filas de la misma fuente —USDA guarda entradas
 * repetidas del mismo queso—, y entonces «Usar el de USDA» aparecía dos veces,
 * palabra por palabra, sin forma de saber cuál era cuál. Si la fuente se
 * repite, manda la cifra que las separa.
 */
export function readingLabel(
  reading: SourceReading,
  readings: SourceReading[],
): string {
  const nombre = sourceName(reading.source);
  const repetida =
    readings.filter((r) => r.source === reading.source).length > 1;
  if (!repetida || reading.calories === null) return nombre;
  const kcal = new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: 1,
  }).format(reading.calories);
  return `${nombre} · ${kcal} kcal`;
}

export type AgreementVerdict =
  /** Una sola medición: no hay nada con qué contrastar. */
  | { kind: "sola" }
  /**
   * Dos o más fuentes que se parecen. `divergencePct` es nulo cuando NINGÚN
   * macro llegó a la diferencia mínima: no es que falte el dato, es que no
   * hay desacuerdo que medir — el acuerdo más fuerte posible.
   */
  | {
      kind: "corroborado";
      others: ProviderSource[];
      divergencePct: number | null;
    }
  /** Dos o más fuentes que no se parecen: alguien se equivocó. */
  | { kind: "discrepa"; others: ProviderSource[]; divergencePct: number };

/**
 * El veredicto de un alimento.
 *
 * Lo que manda es cuántas fuentes INDEPENDIENTES hay: dos filas de USDA del
 * mismo queso no corroboran nada, aunque sí sean un desacuerdo que revisar.
 *
 * Una divergencia nula con dos fuentes NO es falta de dato. Significa que
 * ningún macro llegó siquiera a la diferencia mínima, o sea que coinciden —y
 * tratarlo como «no se puede afirmar nada» tenía el efecto exacto al revés
 * del que se busca: cuanto mejor se ponían de acuerdo las fuentes, menos
 * decía el sello. Las Rellenitas, con 500 kcal idénticas en USDA y en Open
 * Food Facts, se quedaban sin sello.
 */
export function agreementVerdict(
  agreement: SourceAgreement | null | undefined,
): AgreementVerdict {
  if (!agreement) return { kind: "sola" };
  const { readings, maxDivergencePct: divergencia } = agreement;
  const fuentes = [...new Set(readings.map((r) => r.source))];
  if (fuentes.length < 2) return { kind: "sola" };

  const others = fuentes.filter((s) => s !== agreement.canonical);
  return divergencia !== null && divergencia > DIVERGENCE_THRESHOLD
    ? { kind: "discrepa", others, divergencePct: divergencia }
    : { kind: "corroborado", others, divergencePct: divergencia };
}

/**
 * `floor`: por debajo de esta cantidad, el macro es demasiado pequeño para que
 * un porcentaje signifique nada. `minGap`: por debajo de esta diferencia, el
 * desacuerdo no cambia ninguna comida.
 *
 * Las dos hacen falta, y la segunda se añadió mirando un caso real. «Cheese,
 * Mexican blend» salía con un 95,8 % de divergencia —el peor del catálogo— y
 * lo mandaba carbohidratos: 0,1 g contra 2,4 g. Pasaba el suelo, porque el
 * valor mayor (2,4) está por encima de 2. Pero sus calorías difieren un 5,7 %,
 * su proteína un 6,8 % y su grasa un 8,7 %: es la variación normal entre dos
 * mediciones del mismo queso, no un error. El titular del 95,8 % lo producía
 * el macro más pequeño, y alarmas así entierran las de verdad.
 */
const MACROS = [
  { key: "calories", label: "Calorías", unit: "kcal", floor: 20, minGap: 15 },
  { key: "proteinG", label: "Proteína", unit: "g", floor: 2, minGap: 3 },
  {
    key: "carbohydrateG",
    label: "Carbohidratos",
    unit: "g",
    floor: 2,
    minGap: 3,
  },
  { key: "fatG", label: "Grasas", unit: "g", floor: 2, minGap: 3 },
] as const;

export type MacroDisagreement = {
  key: (typeof MACROS)[number]["key"];
  label: string;
  unit: string;
  canonical: number;
  other: number;
  divergencePct: number;
};

/**
 * Diferencia relativa entre dos valores, en por ciento.
 *
 * Por debajo del suelo devuelve null, y no es un detalle: «Egg, white, dried»
 * salía con un 100 % de divergencia porque una fuente da 0,0 g de grasa y otra
 * 0,7 g. En porcentaje es el doble; en el plato no es nada. Comparar
 * porcentajes de cantidades diminutas produce alarmas falsas que entierran las
 * de verdad.
 */
function divergencia(
  a: number,
  b: number,
  floor: number,
  minGap: number,
): number | null {
  const mayor = Math.max(Math.abs(a), Math.abs(b));
  if (mayor === 0) return 0;
  if (mayor < floor) return null;
  if (Math.abs(a - b) < minGap) return null;
  return (Math.abs(a - b) / mayor) * 100;
}

/**
 * En qué macronutrientes discrepan la medición canónica y otra, de mayor a
 * menor desacuerdo. Es lo que una persona necesita para juzgar: «difiere un
 * 63 %» no dice nada, «405 kcal contra 150» se decide solo.
 */
export function macroDisagreements(
  canonical: SourceReading,
  other: SourceReading,
): MacroDisagreement[] {
  const salida: MacroDisagreement[] = [];
  for (const macro of MACROS) {
    const a = canonical[macro.key];
    const b = other[macro.key];
    if (a === null || b === null) continue;
    const d = divergencia(a, b, macro.floor, macro.minGap);
    if (d === null || d === 0) continue;
    salida.push({
      key: macro.key,
      label: macro.label,
      unit: macro.unit,
      canonical: a,
      other: b,
      divergencePct: d,
    });
  }
  return salida.sort((x, y) => y.divergencePct - x.divergencePct);
}

/** «0,7 %» con la coma decimal de es-419, y sin decimal cuando es redondo. */
export function formatDivergence(pct: number): string {
  return `${new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: 1,
  }).format(pct)} %`;
}
