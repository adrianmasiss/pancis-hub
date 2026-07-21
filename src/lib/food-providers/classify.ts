/**
 * Clasificacion de alimentos externos: los proveedores no usan los grupos
 * de Pancis Hub, asi que se infieren desde la categoria y el nombre y, si
 * eso no alcanza, desde el reparto de macros.
 *
 * La inferencia es una APROXIMACION: el usuario puede corregir el grupo al
 * importar. Nunca se marca un alimento inferido como verificado.
 */
import type { FoodGroup } from "@/features/foods/schemas";
import type { MacroSet } from "@/features/nutrition/lib/macros";

/** Minusculas y sin acentos, para comparar y para claves de cache. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Palabras clave por grupo, en ingles y espanol, porque USDA responde en
 * ingles y Open Food Facts mezcla ambos. El orden importa: se evalua de
 * arriba hacia abajo y gana la primera coincidencia, por eso los grupos
 * mas especificos van antes que los genericos.
 *
 * Se comparan como PALABRAS COMPLETAS, no como subcadenas: "res" no debe
 * activarse dentro de "preserves" ni "papa" dentro de "papaya". Ese bug
 * clasificaba Nutella como proteina.
 */
const GROUP_KEYWORDS: readonly (readonly [FoodGroup, readonly string[]])[] = [
  [
    "bebida",
    [
      "beverage", "drink", "juice", "soda", "water", "coffee", "tea", "beer",
      "wine", "bebida", "jugo", "refresco", "agua", "cafe", "te", "cerveza",
    ],
  ],
  [
    "lacteo",
    [
      "milk", "cheese", "yogurt", "yoghurt", "cream", "dairy", "butter",
      "leche", "queso", "yogur", "crema", "lacteo", "mantequilla",
    ],
  ],
  [
    "legumbre",
    [
      "bean", "beans", "lentil", "lentils", "chickpea", "pea", "peas",
      "soy", "legume", "frijol", "frijoles",
      "lenteja", "garbanzo", "arveja", "soya", "legumbre", "poroto",
    ],
  ],
  [
    "fruta",
    [
      "fruit", "apple", "banana", "orange", "berry", "grape", "mango",
      "pineapple", "melon", "fruta", "manzana", "banano", "naranja", "fresa",
      "uva", "pina", "papaya", "sandia",
    ],
  ],
  [
    "verdura",
    [
      "vegetable", "lettuce", "spinach", "broccoli", "carrot", "tomato",
      "onion", "pepper", "cucumber", "verdura", "vegetal", "lechuga",
      "espinaca", "brocoli", "zanahoria", "tomate", "cebolla", "pepino",
    ],
  ],
  [
    "proteina",
    [
      "chicken", "beef", "pork", "fish", "turkey", "egg", "meat", "salmon",
      "tuna", "shrimp", "pollo", "res", "cerdo", "pescado", "pavo", "huevo",
      "carne", "atun", "camaron",
    ],
  ],
  [
    "carbohidrato",
    [
      "rice", "bread", "pasta", "potato", "oat", "cereal", "flour", "tortilla",
      "corn", "wheat", "arroz", "pan", "papa", "avena", "harina", "maiz",
      "trigo", "platano", "yuca",
    ],
  ],
  [
    "grasa",
    [
      "oil", "nut", "almond", "avocado", "seed", "olive", "peanut", "aceite",
      "nuez", "almendra", "aguacate", "semilla", "oliva", "mani",
    ],
  ],
];

/** Grupo segun el macro dominante, cuando el nombre no dice nada. */
function groupFromMacros(per100g: MacroSet): FoodGroup {
  const proteinKcal = per100g.proteinG * 4;
  const carbKcal = per100g.carbohydrateG * 4;
  const fatKcal = per100g.fatG * 9;
  const total = proteinKcal + carbKcal + fatKcal;
  if (total <= 0) return "otro";

  const proteinShare = proteinKcal / total;
  const carbShare = carbKcal / total;
  const fatShare = fatKcal / total;

  // Umbral alto: solo se asigna un grupo cuando un macro claramente domina;
  // de lo contrario el alimento es mixto y asi se declara.
  if (proteinShare >= 0.5) return "proteina";
  if (fatShare >= 0.5) return "grasa";
  if (carbShare >= 0.6) return "carbohidrato";
  return "mixto";
}

/** Palabras del texto, ya normalizadas y sin puntuacion. */
function tokenize(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

export function inferFoodGroup(
  name: string,
  category: string | null,
  per100g: MacroSet,
): FoodGroup {
  const tokens = tokenize(`${category ?? ""} ${name}`);
  for (const [group, keywords] of GROUP_KEYWORDS) {
    if (keywords.some((keyword) => tokens.has(keyword))) return group;
  }
  return groupFromMacros(per100g);
}

const RAW_HINTS = ["raw", "uncooked", "crudo", "cruda", "fresh", "fresco"];
const COOKED_HINTS = [
  "cooked", "boiled", "roasted", "grilled", "baked", "fried", "steamed",
  "cocido", "cocida", "hervido", "asado", "horneado", "frito", "vapor",
];

/**
 * Estado crudo/cocido: critico para no mezclar 100 g de arroz crudo con
 * 100 g de arroz cocido. Ante la duda devuelve null en vez de adivinar.
 */
export function inferCookedState(name: string): "crudo" | "cocido" | null {
  const tokens = tokenize(name);
  const isRaw = RAW_HINTS.some((hint) => tokens.has(hint));
  const isCooked = COOKED_HINTS.some((hint) => tokens.has(hint));
  if (isRaw === isCooked) return null;
  return isRaw ? "crudo" : "cocido";
}

/**
 * Alias de busqueda a partir del nombre del proveedor. USDA usa nombres
 * como "Chicken, broilers or fryers, breast, meat only, raw": cada
 * fragmento util se guarda como alias para que la busqueda local lo
 * encuentre despues.
 */
export function deriveAliases(name: string): string[] {
  const parts = name
    .split(/[,()/]/)
    .map((part) => normalizeText(part))
    .filter((part) => part.length >= 3 && part.length <= 40);
  return [...new Set(parts)].slice(0, 6);
}
