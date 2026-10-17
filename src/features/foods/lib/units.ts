/**
 * Unidades de medida de un alimento: gramos por defecto, y además las que
 * tengan sentido para ESE alimento.
 *
 * Todo se cuenta en la base de su etiqueta —gramos si los valores son por
 * 100 g, mililitros si son por 100 ml—, así que el factor sobre los valores
 * es siempre `base / 100`, sin conversiones que alejen el número de lo que
 * dice la fuente. Cada unidad sabe cuánta base hay en una de ella.
 *
 * Qué unidades se ofrecen, y por qué:
 *
 * - Masa (g, kg, oz, lb): siempre. Son factores fijos.
 * - Volumen (ml, l) sólo para líquidos; taza y cucharadas para cualquier
 *   alimento con densidad medida (USDA pesa una taza de cada cosa). Sin
 *   densidad no se ofrecen: una taza de harina y una de aceite no pesan lo
 *   mismo, e inventarlo sería dar un número sin razón.
 * - Porciones caseras («1 unidad mediana», «1 lata»), con su peso medido.
 *
 * `approx` marca las conversiones estimadas para que la pantalla lo diga
 * con «≈». Una porción medida o un factor de masa no son estimaciones.
 */

export type NutritionBasis = "100g" | "100ml";

export type UnitFood = {
  name: string;
  group: string;
  basis: NutritionBasis;
  /** Gramos por mililitro; null si no está medida. */
  density: number | null;
  portions: { label: string; grams: number }[];
};

export type MeasureUnit = {
  id: string;
  /** Lo que acompaña a la cifra: «g», «ml», «taza», «unidad mediana». */
  short: string;
  /** Plural de `short`; igual cuando no cambia («g», «ml»). */
  plural: string;
  /** Rótulo completo en el selector: «Taza (≈ 249 g)». */
  label: string;
  /** Cuánta base (g o ml, según la etiqueta) hay en una unidad. */
  basePerUnit: number;
  step: number;
  decimals: number;
  min: number;
  max: number;
  /** Cantidad con la que se abre al elegirla, si no hay conversión mejor. */
  start: number;
  approx: boolean;
  kind: "masa" | "volumen" | "porcion";
};

export const VOLUME_ML = {
  taza: 236.588,
  cucharada: 14.787,
  cucharadita: 4.929,
} as const;

const LIQUID_NAME =
  /\b(leche|aceite|jugo|caldo|bebida|néctar|vinagre|refresco|café|té|agua|limonada|batido|yogur líquido|kéfir|horchata|ponche)\b/i;

/** Bebidas y líquidos: los que se miden en ml. */
export function isLiquid(food: UnitFood): boolean {
  return (
    food.basis === "100ml" ||
    food.group === "bebida" ||
    LIQUID_NAME.test(food.name)
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(n);

/** «unidad mediana» → «unidades medianas»; «porción» → «porciones». */
export function pluralize(text: string): string {
  return text
    .split(" ")
    .map((word, i) => {
      // Sólo el sustantivo y sus adjetivos, no lo que va tras «de».
      if (i > 0 && /^(de|del|con|sin|en|\(.*)$/.test(word)) return word;
      if (/ón$/.test(word)) return word.replace(/ón$/, "ones");
      if (/[aeiouáéó]$/.test(word)) return `${word}s`;
      if (/[dlnrz]$/.test(word))
        return word.endsWith("z") ? `${word.slice(0, -1)}ces` : `${word}es`;
      return word;
    })
    .join(" ");
}

/* Lo que ya cubren taza y cucharadas cuando hay densidad: si no, la lista
   diría dos veces «taza». */
const VOLUME_PORTION = /^1 (taza|cucharada|cucharadita|onza líquida)$/;

export function unitsFor(food: UnitFood): MeasureUnit[] {
  const ml = food.basis === "100ml";
  /* Gramos de base en un gramo y en un mililitro. En una etiqueta por 100 ml
     sin densidad medida se asume 1 g/ml, y se dice. */
  const density = food.density ?? (ml ? 1 : null);
  const gramToBase = ml ? 1 / (density ?? 1) : 1;
  const mlToBase = ml ? 1 : density;
  const massApprox = ml && food.density === null;
  const liquid = isLiquid(food);

  const units: MeasureUnit[] = [];
  const add = (unit: Omit<MeasureUnit, "plural"> & { plural?: string }) =>
    units.push({ plural: unit.short, ...unit });

  add({
    id: "g",
    short: "g",
    label: "Gramos",
    basePerUnit: gramToBase,
    step: 10,
    decimals: 0,
    min: 1,
    max: 2000,
    start: 100,
    approx: massApprox,
    kind: "masa",
  });

  if (mlToBase !== null && liquid) {
    add({
      id: "ml",
      short: "ml",
      label: "Mililitros",
      basePerUnit: mlToBase,
      step: 25,
      decimals: 0,
      min: 1,
      max: 3000,
      start: ml ? 100 : 250,
      approx: !ml,
      kind: "volumen",
    });
    add({
      id: "l",
      short: "l",
      label: "Litros",
      basePerUnit: mlToBase * 1000,
      step: 0.25,
      decimals: 2,
      min: 0.05,
      max: 3,
      start: 1,
      approx: !ml,
      kind: "volumen",
    });
  }

  if (mlToBase !== null && (food.density !== null || liquid)) {
    /* En una etiqueta por 100 ml la taza es exacta: son 237 ml. En una por
       100 g se pasa por la densidad, y eso es una estimación. */
    const v = (
      id: keyof typeof VOLUME_ML,
      short: string,
      plural: string,
      name: string,
      step: number,
    ) =>
      add({
        id,
        short,
        plural,
        label: ml
          ? `${name} (${fmt(VOLUME_ML[id])} ml)`
          : `${name} (≈ ${fmt(VOLUME_ML[id] * (density ?? 1))} g)`,
        basePerUnit: mlToBase * VOLUME_ML[id],
        step,
        decimals: 2,
        min: 0.25,
        max: 20,
        start: 1,
        approx: !ml,
        kind: "volumen",
      });
    v("taza", "taza", "tazas", "Taza", 0.25);
    v("cucharada", "cda", "cdas", "Cucharada", 0.5);
    v("cucharadita", "cdta", "cdtas", "Cucharadita", 0.5);
  }

  const seen = new Set<string>();
  for (const portion of food.portions) {
    if (!(portion.grams > 0)) continue;
    const label = portion.label.trim();
    if (food.density !== null && VOLUME_PORTION.test(label)) continue;
    // «1 unidad mediana» → la unidad es «unidad mediana».
    const noun = label.replace(/^1\s+/, "");
    if (!noun || seen.has(noun.toLowerCase()) || /^\d/.test(noun)) continue;
    seen.add(noun.toLowerCase());
    // Lo que va junto a la cifra, sin detalles: «envase», no «envase (355 ml)».
    const head = noun
      .split(",")[0]!
      .replace(/\s*\(.*\)\s*/, "")
      .trim();
    const name = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
    add({
      id: `p:${noun}`,
      short: head,
      plural: pluralize(head),
      // «1 envase (355 ml)» ya dice cuánto es; no se le añade el peso.
      label: noun.includes("(")
        ? name
        : `${name} (${massApprox ? "≈ " : ""}${fmt(portion.grams)} g)`,
      basePerUnit: portion.grams * gramToBase,
      step: 0.5,
      decimals: 1,
      min: 0.5,
      max: 20,
      start: 1,
      approx: massApprox,
      kind: "porcion",
    });
  }

  add({
    id: "oz",
    short: "oz",
    label: "Onzas",
    basePerUnit: 28.3495 * gramToBase,
    step: 1,
    decimals: 1,
    min: 0.5,
    max: 70,
    start: 4,
    approx: massApprox,
    kind: "masa",
  });
  add({
    id: "lb",
    short: "lb",
    label: "Libras",
    basePerUnit: 453.592 * gramToBase,
    step: 0.25,
    decimals: 2,
    min: 0.05,
    max: 4,
    start: 0.5,
    approx: massApprox,
    kind: "masa",
  });
  add({
    id: "kg",
    short: "kg",
    label: "Kilogramos",
    basePerUnit: 1000 * gramToBase,
    step: 0.1,
    decimals: 2,
    min: 0.01,
    max: 2,
    start: 0.5,
    approx: massApprox,
    kind: "masa",
  });
  return units;
}

/** La unidad con la que se abre la ficha: ml para lo que se bebe o se sirve líquido. */
export function defaultUnit(units: MeasureUnit[], food: UnitFood) {
  const ml = units.find((u) => u.id === "ml");
  if (ml && isLiquid(food)) return ml;
  return units[0]!;
}

/** Redondea a la precisión de la unidad y la encaja en sus límites. */
export function clampAmount(unit: MeasureUnit, value: number): number {
  const factor = 10 ** unit.decimals;
  const rounded = Math.round(value * factor) / factor;
  return Math.min(unit.max, Math.max(unit.min, rounded));
}

/**
 * La cantidad equivalente al cambiar de unidad. Entre masas (o entre
 * volúmenes) se conserva lo que había: 100 g son 3,5 oz. Hacia una porción o
 * una medida casera se abre en 1: «0,63 tazas» no es una cantidad que nadie
 * sirva.
 */
export function convertAmount(
  from: MeasureUnit,
  to: MeasureUnit,
  amount: number,
): number {
  if (
    to.kind === "porcion" ||
    ["taza", "cucharada", "cucharadita"].includes(to.id)
  )
    return to.start;
  const base = amount * from.basePerUnit;
  const next = clampAmount(to, base / to.basePerUnit);
  // Una conversión que cae en el mínimo no es la cantidad de antes.
  return next <= to.min ? to.start : next;
}

/** «1,5 tazas», «250 ml», «1 unidad mediana». */
export function formatAmount(unit: MeasureUnit, amount: number): string {
  const n = new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: unit.decimals,
  }).format(amount);
  const word =
    amount === 1 || unit.short === unit.plural ? unit.short : unit.plural;
  return `${n} ${word}`;
}
