/**
 * Motor de equivalencias de alimentos (docs/02_PRODUCT_REQUIREMENTS.md 5.4).
 *
 * Formula de puntaje (menor = mas similar), documentada en docs/DECISIONS.md:
 *
 *   score = wCal   x |dif calorias|
 *         + wProt  x |dif proteina|
 *         + wCarb  x |dif carbohidratos|
 *         + wGrasa x |dif grasas|
 *         + wFibra x |dif fibra|
 *         + penalizacion por grupo distinto
 *         + penalizacion por estado (crudo/cocido) distinto
 *         - bono por favorito
 *         - bono por uso reciente
 *
 * Las diferencias se calculan entre la porcion original y la porcion
 * equivalente sugerida. La cantidad equivalente iguala el "macro ancla"
 * del grupo del alimento original (carbohidratos para un carbohidrato,
 * proteina para una proteina, etc.), porque ese es el rol que la comida
 * cumple en el plan. Los resultados son APROXIMACIONES, nunca se
 * presentan como equivalencias exactas.
 */
import { scaleMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import type { FoodGroup } from "@/features/foods/schemas";
import {
  findRestrictionMatch,
  matchesRestriction,
} from "@/features/foods/lib/allergens";

export type EquivalenceFood = {
  id: string;
  name: string;
  foodGroup: FoodGroup;
  cookedState: "crudo" | "cocido" | null;
  per100g: MacroSet;
};

/** Puntuacion 0-10 por macro y global, para mostrar al usuario. */
export type CompatibilityScore = {
  overall: number;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

export type SwapCandidate = {
  food: EquivalenceFood;
  suggestedQuantityG: number;
  /**
   * Equivalencia domestica de la cantidad sugerida ("≈ ½ taza"), si el
   * alimento tiene porciones definidas. La rellenan las server actions, que
   * son las que conocen las porciones; el motor puro la deja sin definir.
   */
  householdEquivalence?: string | null;
  macros: MacroSet;
  /** Diferencia alternativa - original (positivo = la alternativa aporta mas). */
  diff: MacroSet;
  sameGroup: boolean;
  isFavorite: boolean;
  isRecent: boolean;
  /** true si el usuario declaro tener este alimento en su despensa. */
  isAvailable: boolean;
  score: number;
  compatibility: CompatibilityScore;
};

/** Pesos por unidad de diferencia (1 kcal, 1 g). */
export const MACRO_WEIGHTS = {
  calories: 1,
  proteinG: 10,
  carbohydrateG: 4,
  fatG: 6,
  fiberG: 2,
} as const;

export const PENALTIES = {
  differentGroup: 120,
  differentCookedState: 15,
  favoriteBonus: 12,
  recentBonus: 6,
} as const;

const MIN_QUANTITY_G = 5;
const MAX_QUANTITY_G = 1500;

type AnchorMacro = keyof MacroSet;

/** Macro que define el rol del alimento en el plan segun su grupo. */
export function anchorMacroForGroup(group: FoodGroup): AnchorMacro {
  switch (group) {
    case "proteina":
      return "proteinG";
    case "carbohidrato":
    case "fruta":
    case "legumbre":
      return "carbohydrateG";
    case "grasa":
      return "fatG";
    default:
      return "calories";
  }
}

/**
 * Cantidad de la alternativa que iguala el macro ancla de la porcion
 * original. Si la alternativa casi no aporta ese macro, se iguala por
 * calorias. Redondeada a 5 g y acotada a un rango razonable.
 */
export function equivalentQuantity(
  source: EquivalenceFood,
  sourceQuantityG: number,
  target: EquivalenceFood,
): number {
  let anchor = anchorMacroForGroup(source.foodGroup);
  if (target.per100g[anchor] < 1) anchor = "calories";
  if (target.per100g[anchor] < 1) return sourceQuantityG;

  const sourceAmount = (source.per100g[anchor] * sourceQuantityG) / 100;
  const raw = (sourceAmount / target.per100g[anchor]) * 100;
  const rounded = Math.round(raw / 5) * 5;
  return Math.min(MAX_QUANTITY_G, Math.max(MIN_QUANTITY_G, rounded));
}

/**
 * Peso de cada macro en la puntuacion global de compatibilidad. La
 * proteina pesa mas porque es el macro que el usuario menos quiere perder
 * al sustituir, y la fibra menos porque es el mas facil de recuperar en
 * otra comida.
 */
export type MacroWeights = {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

/**
 * Pesos por ROL del alimento en el plan (EQ-002).
 *
 * El doc 05 define tres perfiles y el codigo implementaba uno solo, parecido
 * al proteico. Consecuencia practica: al cambiar arroz por pasta ponderaba la
 * proteina con 0.35 y los carbohidratos con 0.15, justo al reves de lo que
 * define el papel de ese alimento en la comida.
 *
 * El motor ya sabia cual es el rol: `anchorMacroForGroup()` lo calcula para
 * la cantidad equivalente. Solo faltaba usarlo tambien aqui.
 *
 * Son parametros de producto a calibrar, no conclusiones cientificas: el
 * propio doc 05 lo dice.
 */
export const COMPATIBILITY_PROFILES = {
  proteico: {
    calories: 0.25,
    proteinG: 0.35,
    carbohydrateG: 0.15,
    fatG: 0.2,
    fiberG: 0.05,
  },
  carbohidrato: {
    calories: 0.25,
    proteinG: 0.15,
    carbohydrateG: 0.35,
    fatG: 0.15,
    fiberG: 0.1,
  },
  comida: {
    calories: 0.25,
    proteinG: 0.3,
    carbohydrateG: 0.2,
    fatG: 0.15,
    fiberG: 0.1,
  },
} as const satisfies Record<string, MacroWeights>;

export type CompatibilityProfile = keyof typeof COMPATIBILITY_PROFILES;

/** Perfil que corresponde al rol del alimento original en el plan. */
export function profileForGroup(group: FoodGroup): CompatibilityProfile {
  switch (anchorMacroForGroup(group)) {
    case "proteinG":
      return "proteico";
    case "carbohydrateG":
      return "carbohidrato";
    default:
      return "comida";
  }
}

/** Compatibilidad general, cuando no se conoce el rol. */
export const COMPATIBILITY_WEIGHTS = COMPATIBILITY_PROFILES.comida;

/**
 * Piso por macro para no castigar diferencias irrelevantes en cantidades
 * minimas: pasar de 1 g a 2 g de grasa duplica el valor, pero no cambia
 * nada del plan. Sin este piso, la division daria un error del 100 %.
 */
const COMPATIBILITY_FLOORS = {
  calories: 40,
  proteinG: 5,
  carbohydrateG: 5,
  fatG: 3,
  fiberG: 2,
} as const;

/** Puntos que se descuentan de la nota global. */
export const COMPATIBILITY_PENALTIES = {
  differentGroup: 1.5,
  differentCookedState: 0.5,
} as const;

const clamp10 = (value: number) => Math.min(10, Math.max(0, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Nota 0-10 de un macro: 10 cuando la alternativa aporta lo mismo, 0
 * cuando se desvia el 100 % o mas respecto al original.
 */
function macroScore(
  source: number,
  candidate: number,
  floor: number,
): number {
  const base = Math.max(Math.abs(source), floor);
  const relativeError = Math.abs(candidate - source) / base;
  return clamp10(10 * (1 - relativeError));
}

/**
 * Puntuacion de compatibilidad de una sustitucion, en 0-10 por macro y
 * global (docs/DECISIONS.md). Es una APROXIMACION orientativa: resume que
 * tan cerca queda la alternativa del aporte original, nunca afirma que
 * sean equivalentes.
 */
export function compatibilityScore(
  source: MacroSet,
  candidate: MacroSet,
  options?: {
    sameGroup?: boolean;
    sameCookedState?: boolean;
    /** Rol del alimento original. Sin el se usa el perfil de comida. */
    profile?: CompatibilityProfile;
  },
): CompatibilityScore {
  const weights =
    COMPATIBILITY_PROFILES[options?.profile ?? "comida"];
  const perMacro = {
    calories: macroScore(
      source.calories,
      candidate.calories,
      COMPATIBILITY_FLOORS.calories,
    ),
    proteinG: macroScore(
      source.proteinG,
      candidate.proteinG,
      COMPATIBILITY_FLOORS.proteinG,
    ),
    carbohydrateG: macroScore(
      source.carbohydrateG,
      candidate.carbohydrateG,
      COMPATIBILITY_FLOORS.carbohydrateG,
    ),
    fatG: macroScore(source.fatG, candidate.fatG, COMPATIBILITY_FLOORS.fatG),
    fiberG: macroScore(
      source.fiberG,
      candidate.fiberG,
      COMPATIBILITY_FLOORS.fiberG,
    ),
  };

  const weighted =
    perMacro.calories * weights.calories +
    perMacro.proteinG * weights.proteinG +
    perMacro.carbohydrateG * weights.carbohydrateG +
    perMacro.fatG * weights.fatG +
    perMacro.fiberG * weights.fiberG;

  const penalties =
    (options?.sameGroup === false ? COMPATIBILITY_PENALTIES.differentGroup : 0) +
    (options?.sameCookedState === false
      ? COMPATIBILITY_PENALTIES.differentCookedState
      : 0);

  return {
    overall: round1(clamp10(weighted - penalties)),
    calories: round1(perMacro.calories),
    proteinG: round1(perMacro.proteinG),
    carbohydrateG: round1(perMacro.carbohydrateG),
    fatG: round1(perMacro.fatG),
    fiberG: round1(perMacro.fiberG),
  };
}

export function nutritionalDistance(a: MacroSet, b: MacroSet): number {
  return (
    MACRO_WEIGHTS.calories * Math.abs(a.calories - b.calories) +
    MACRO_WEIGHTS.proteinG * Math.abs(a.proteinG - b.proteinG) +
    MACRO_WEIGHTS.carbohydrateG * Math.abs(a.carbohydrateG - b.carbohydrateG) +
    MACRO_WEIGHTS.fatG * Math.abs(a.fatG - b.fatG) +
    MACRO_WEIGHTS.fiberG * Math.abs(a.fiberG - b.fiberG)
  );
}

/**
 * Alergias y restricciones. La implementacion vive en `./allergens` y compara
 * por palabra, no por subcadena: "leche" ya no excluye "lechuga", y declarar
 * "lacteos" excluye queso, yogur y mantequilla.
 *
 * Se reexporta desde aqui para no romper a quien ya la importaba.
 */
export { matchesRestriction, findRestrictionMatch };

/**
 * Criterios de busqueda de alternativas (docs 5.2).
 *
 * "similar" es el comportamiento por defecto: la alternativa mas parecida
 * al original. Los demas reordenan segun lo que el usuario busca en ese
 * momento, sin dejar de mostrar la compatibilidad para que vea el costo
 * de alejarse del plan.
 *
 * NO se incluye un criterio economico: la aplicacion no tiene datos de
 * precio y ninguna fuente gratuita los publica de forma fiable. Ofrecer
 * un orden "mas barato" inventado seria peor que no ofrecerlo.
 */
export const SWAP_FILTERS = [
  "similar",
  "mas_proteina",
  "menos_calorias",
  "mas_saciedad",
  "disponibles",
] as const;

export type SwapFilter = (typeof SWAP_FILTERS)[number];

export type RankInput = {
  source: EquivalenceFood;
  sourceQuantityG: number;
  candidates: EquivalenceFood[];
  favoriteIds: Set<string>;
  recentIds: Set<string>;
  /** Alimentos que el usuario declaro tener en casa (despensa). */
  pantryIds?: Set<string>;
  restrictions: string[];
  maxResults?: number;
  filter?: SwapFilter;
};

/**
 * Indice de saciedad aproximado: proteina y fibra son los componentes con
 * respaldo mas consistente para sostenerla. Es una APROXIMACION util para
 * ordenar, no una medida validada.
 */
export function satietyIndex(macros: MacroSet): number {
  return macros.proteinG * 1.5 + macros.fiberG * 2;
}

/**
 * Densidad por 100 kcal.
 *
 * Comparar totales no sirve como criterio: la cantidad sugerida ya iguala
 * el macro ancla, asi que "mas proteina" saldria trivialmente cierto por
 * redondeo. Lo que el usuario busca al pedir "mas proteina" es mas
 * proteina POR EL MISMO COSTO CALORICO.
 */
function perCalorie(value: number, calories: number): number {
  return calories <= 0 ? 0 : (value / calories) * 100;
}

export function proteinDensity(macros: MacroSet): number {
  return perCalorie(macros.proteinG, macros.calories);
}

export function satietyDensity(macros: MacroSet): number {
  return perCalorie(satietyIndex(macros), macros.calories);
}

/** Margen minimo para considerar que un criterio mejora de verdad. */
const MEANINGFUL_GAIN = 1.05;

/**
 * Clave de ordenamiento segun el criterio elegido. Menor = mejor, para
 * mantener la misma convencion que el puntaje de distancia.
 */
function filterSortKey(
  candidate: SwapCandidate,
  filter: SwapFilter,
  hasPantry: boolean,
): number {
  switch (filter) {
    case "mas_proteina":
      return -proteinDensity(candidate.macros);
    case "menos_calorias":
      return candidate.macros.calories;
    case "mas_saciedad":
      return -satietyDensity(candidate.macros);
    case "disponibles":
      // Con despensa, lo que el usuario ya tiene en casa va primero. Sin
      // despensa, se cae a favoritos y recientes como aproximacion.
      if (hasPantry) return candidate.isAvailable ? 0 : 1;
      return candidate.isFavorite ? 0 : candidate.isRecent ? 1 : 2;
    case "similar":
    default:
      return candidate.score;
  }
}

/**
 * Un criterio distinto de "similar" solo tiene sentido si la alternativa
 * mejora en esa direccion; si no, se queda fuera para no ofrecer como
 * "mas proteina" algo que aporta menos.
 */
function passesFilter(
  candidate: SwapCandidate,
  sourceMacros: MacroSet,
  filter: SwapFilter,
  hasPantry: boolean,
): boolean {
  switch (filter) {
    case "mas_proteina":
      return (
        proteinDensity(candidate.macros) >
        proteinDensity(sourceMacros) * MEANINGFUL_GAIN
      );
    case "menos_calorias":
      return candidate.macros.calories < sourceMacros.calories;
    case "mas_saciedad":
      return (
        satietyDensity(candidate.macros) >
        satietyDensity(sourceMacros) * MEANINGFUL_GAIN
      );
    case "disponibles":
      // Con despensa, solo lo que el usuario tiene en casa; sin despensa,
      // se cae a favoritos y recientes para no dejar la lista vacia.
      return hasPantry
        ? candidate.isAvailable
        : candidate.isFavorite || candidate.isRecent;
    case "similar":
    default:
      return true;
  }
}

export function rankAlternatives({
  source,
  sourceQuantityG,
  candidates,
  favoriteIds,
  recentIds,
  pantryIds,
  restrictions,
  maxResults = 8,
  filter = "similar",
}: RankInput): SwapCandidate[] {
  const sourceMacros = scaleMacros(source.per100g, sourceQuantityG);
  const hasPantry = (pantryIds?.size ?? 0) > 0;

  const round1 = (value: number) => Math.round(value * 10) / 10;

  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .filter((candidate) => !matchesRestriction(candidate.name, restrictions))
    .map((candidate) => {
      const suggestedQuantityG = equivalentQuantity(
        source,
        sourceQuantityG,
        candidate,
      );
      const macros = scaleMacros(candidate.per100g, suggestedQuantityG);
      const sameGroup = candidate.foodGroup === source.foodGroup;
      const sameState =
        source.cookedState === null ||
        candidate.cookedState === null ||
        candidate.cookedState === source.cookedState;
      const isFavorite = favoriteIds.has(candidate.id);
      const isRecent = recentIds.has(candidate.id);
      const isAvailable = pantryIds?.has(candidate.id) ?? false;

      const score =
        nutritionalDistance(sourceMacros, macros) +
        (sameGroup ? 0 : PENALTIES.differentGroup) +
        (sameState ? 0 : PENALTIES.differentCookedState) -
        (isFavorite ? PENALTIES.favoriteBonus : 0) -
        (isRecent ? PENALTIES.recentBonus : 0);

      return {
        food: candidate,
        suggestedQuantityG,
        macros,
        diff: {
          calories: Math.round(macros.calories - sourceMacros.calories),
          proteinG: round1(macros.proteinG - sourceMacros.proteinG),
          carbohydrateG: round1(
            macros.carbohydrateG - sourceMacros.carbohydrateG,
          ),
          fatG: round1(macros.fatG - sourceMacros.fatG),
          fiberG: round1(macros.fiberG - sourceMacros.fiberG),
        },
        sameGroup,
        isFavorite,
        isRecent,
        isAvailable,
        score: Math.round(score * 10) / 10,
        compatibility: compatibilityScore(sourceMacros, macros, {
          sameGroup,
          sameCookedState: sameState,
          // EQ-002: se pondera segun el papel del alimento ORIGINAL.
          profile: profileForGroup(source.foodGroup),
        }),
      };
    })
    .filter((candidate) =>
      passesFilter(candidate, sourceMacros, filter, hasPantry),
    )
    .sort((a, b) => {
      const byFilter =
        filterSortKey(a, filter, hasPantry) -
        filterSortKey(b, filter, hasPantry);
      // A igualdad en el criterio elegido, gana lo mas parecido al plan.
      return byFilter !== 0 ? byFilter : a.score - b.score;
    })
    .slice(0, maxResults);
}

/**
 * Calcula y formatea la equivalencia en porciones domésticas para una cantidad en gramos dada.
 * Por ejemplo: 150g de huevo (donde 1 unidad = 50g) -> "3 unidades".
 */
export function formatHouseholdEquivalence(
  quantityG: number,
  portions: { label: string; grams: number }[],
): string | null {
  if (!portions || portions.length === 0 || quantityG <= 0) return null;

  // Encontrar la porción disponible.
  const portion = portions[0];
  if (!portion || portion.grams <= 0) return null;

  const ratio = quantityG / portion.grams;

  // Redondear a 1 decimal o a un número entero si está muy cerca.
  let value = Math.round(ratio * 10) / 10;
  if (Math.abs(value - Math.round(value)) < 0.05) {
    value = Math.round(value);
  }

  const label = portion.label.trim();
  // Busca un número al inicio, ej. "1 unidad", "1.5 tazas"
  const match = label.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);

  if (match && match[1] && match[2]) {
    const baseNumber = parseFloat(match[1]);
    const unit = match[2];
    const totalCount = value * baseNumber;

    // Formatear el número total
    let totalCountStr: string;
    if (Math.abs(totalCount - Math.round(totalCount)) < 0.01) {
      totalCountStr = String(Math.round(totalCount));
    } else {
      totalCountStr = totalCount.toFixed(1);
    }

    // Pluralizar unidades en español si es mayor que 1
    let pluralizedUnit = unit;
    if (totalCount > 1) {
      if (unit === "unidad") pluralizedUnit = "unidades";
      else if (unit === "rebanada") pluralizedUnit = "rebanadas";
      else if (unit === "taza") pluralizedUnit = "tazas";
      else if (unit === "cucharada") pluralizedUnit = "cucharadas";
      else if (unit === "envase") pluralizedUnit = "envases";
      else if (unit === "porcion") pluralizedUnit = "porciones";
      else if (unit === "porción") pluralizedUnit = "porciones";
      else if (unit === "pieza") pluralizedUnit = "piezas";
      else if (unit === "plato") pluralizedUnit = "platos";
      else if (unit === "vaso") pluralizedUnit = "vasos";
      else if (unit.endsWith("a") || unit.endsWith("e") || unit.endsWith("o"))
        pluralizedUnit = unit + "s";
      else if (unit.endsWith("n")) pluralizedUnit = unit + "es";
    }

    return `${totalCountStr} ${pluralizedUnit}`;
  }

  // Si no coincide con el regex, e.g. "Un envase entero"
  let valueStr: string;
  if (Math.abs(value - Math.round(value)) < 0.01) {
    valueStr = String(Math.round(value));
  } else {
    valueStr = value.toFixed(1);
  }
  return `${valueStr} x ${label}`;
}

/**
 * Indexa las porciones domesticas por id de alimento a partir de las filas
 * de `foods` con `food_portions` embebidas.
 */
export function buildPortionsMap(
  rows: {
    id: string;
    food_portions?: { label: string; grams: number }[] | null;
  }[],
): Map<string, { label: string; grams: number }[]> {
  const map = new Map<string, { label: string; grams: number }[]>();
  for (const row of rows) {
    if (row.food_portions && row.food_portions.length > 0) {
      map.set(
        row.id,
        row.food_portions.map((portion) => ({
          label: portion.label,
          grams: Number(portion.grams),
        })),
      );
    }
  }
  return map;
}

/**
 * Adjunta a cada alternativa su equivalencia domestica ("≈ 3 unidades")
 * segun la cantidad sugerida y las porciones del alimento. Se hace fuera del
 * motor porque solo las server actions conocen las porciones del catalogo.
 */
export function attachHouseholdEquivalence(
  candidates: SwapCandidate[],
  portionsByFoodId: Map<string, { label: string; grams: number }[]>,
): SwapCandidate[] {
  return candidates.map((candidate) => ({
    ...candidate,
    householdEquivalence: formatHouseholdEquivalence(
      candidate.suggestedQuantityG,
      portionsByFoodId.get(candidate.food.id) ?? [],
    ),
  }));
}
