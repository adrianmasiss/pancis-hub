/**
 * Comer fuera sin servidor: categorias, secciones y las cuentas de un plato
 * (opciones, si cabe en lo que queda, la mejor opcion del dia y lo que
 * aporta). Vive aparte de `queries.ts` para que la pantalla la use en el
 * cliente sin arrastrar Supabase.
 */

import type { RestaurantItem } from "../queries";

/** Tipo de comida del directorio (columna `restaurants.category`). */
export const RESTAURANT_CATEGORIES = [
  "hamburguesas",
  "pollo",
  "sandwiches",
  "pizza",
  "mexicana",
  "asiatica",
  "cafe",
  "saludable",
  "otro",
] as const;
export type RestaurantCategory = (typeof RESTAURANT_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<RestaurantCategory, string> = {
  hamburguesas: "Hamburguesas",
  pollo: "Pollo",
  sandwiches: "Sándwiches",
  pizza: "Pizza",
  mexicana: "Mexicana",
  asiatica: "Asiática",
  cafe: "Café",
  saludable: "Saludable",
  otro: "Otros",
};

/** Secciones del menu, en el orden en que se muestran. */
export const MENU_SECTIONS = [
  "plato",
  "acompanamiento",
  "bebida",
  "postre",
] as const;
export type MenuSection = (typeof MENU_SECTIONS)[number];

export const SECTION_LABEL: Record<MenuSection, string> = {
  plato: "Platos",
  acompanamiento: "Acompañamientos",
  bebida: "Bebidas",
  postre: "Postres",
};

export type DishMacros = {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

/**
 * Las cifras de una porcion con las opciones elegidas. Las opciones son
 * diferencias (pueden restar); nada baja de cero. Null si el plato aun no
 * tiene sus valores.
 */
export function dishMacros(
  item: Pick<
    RestaurantItem,
    "calories" | "proteinG" | "carbohydrateG" | "fatG" | "fiberG" | "options"
  >,
  optionIds: readonly string[] = [],
  portions = 1,
): DishMacros | null {
  if (item.calories === null) return null;
  const elegidas = item.options.filter((o) => optionIds.includes(o.id));
  const sum = (base: number | null, key: keyof DishMacros) =>
    Math.max(
      0,
      ((base ?? 0) + elegidas.reduce((t, o) => t + o[key], 0)) * portions,
    );
  return {
    calories: sum(item.calories, "calories"),
    proteinG: sum(item.proteinG, "proteinG"),
    carbohydrateG: sum(item.carbohydrateG, "carbohydrateG"),
    fatG: sum(item.fatG, "fatG"),
    fiberG: sum(item.fiberG, "fiberG"),
  };
}

export type Fit = "cabe" | "justo" | "te-pasas";

/**
 * Si el plato cabe en lo que queda hoy: «justo» cuando se lleva mas del 80 %
 * de lo que queda. Null sin meta (no hay contra que medir).
 */
export function fitOf(kcal: number, remainingKcal: number | null): Fit | null {
  if (remainingKcal === null) return null;
  if (kcal > remainingKcal) return "te-pasas";
  if (kcal > remainingKcal * 0.8) return "justo";
  return "cabe";
}

/**
 * La mejor opcion para hoy: entre los platos que caben, el que mas proteina
 * aporta (a igual proteina, el mas liviano). Sin meta o sin nada que quepa,
 * no se recomienda nada.
 */
export function bestForToday(
  items: readonly RestaurantItem[],
  remainingKcal: number | null,
): RestaurantItem | null {
  if (remainingKcal === null) return null;
  const candidatos = items.filter(
    (i) =>
      i.section === "plato" &&
      i.calories !== null &&
      i.calories <= remainingKcal,
  );
  candidatos.sort(
    (a, b) =>
      (b.proteinG ?? 0) - (a.proteinG ?? 0) ||
      (a.calories ?? 0) - (b.calories ?? 0),
  );
  return candidatos[0] ?? null;
}

export type DishFact = { label: string; tone: "protein" | "fat" | "fiber" };

/**
 * Lo que aporta una porcion, con los umbrales por porcion de la FDA:
 * «alto en» = 20 % del valor diario o mas (proteina 50 g → 10 g; fibra 28 g
 * → 5,6 g), «buena fuente» = 10 a 19 % (fibra → 2,8 g), «bajo en grasa» =
 * 3 g o menos.
 */
export function dishFacts(m: DishMacros): DishFact[] {
  const out: DishFact[] = [];
  if (m.proteinG >= 10)
    out.push({ label: "Alto en proteína", tone: "protein" });
  if (m.fatG <= 3) out.push({ label: "Bajo en grasa", tone: "fat" });
  if (m.fiberG >= 5.6) out.push({ label: "Alto en fibra", tone: "fiber" });
  else if (m.fiberG >= 2.8)
    out.push({ label: "Buena fuente de fibra", tone: "fiber" });
  return out;
}

/** Iniciales para el avatar del restaurante: «Burger King» → «BK». */
export function initials(name: string): string {
  const palabras = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  const [a = "", b = ""] = palabras;
  if (!a) return "?";
  // Una sigla («KFC») se queda en mayusculas; una palabra, «Su».
  if (!b)
    return a === a.toUpperCase()
      ? a.slice(0, 2)
      : a.charAt(0).toUpperCase() + a.charAt(1).toLowerCase();
  return (a.charAt(0) + b.charAt(0)).toUpperCase();
}
