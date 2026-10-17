/**
 * Que imagen lleva un alimento en el plan.
 *
 * Los alimentos base del catalogo no traen foto, y las fotos gratuitas que
 * hay mezclan bodegones limpios con empaques de marca. Solo se incluyen las
 * limpias, en `public/foods/`; el resto cae a una ilustracion por grupo. Una
 * foto propia (`image_url`, p. ej. de Open Food Facts) siempre manda.
 *
 * Las claves se comparan por palabra entera y sin tildes: «papa» no puede
 * casar con «papaya», ni «pan» con «panqueque».
 */

const PHOTOS: [RegExp, string][] = [
  [/\bhuevos?\b|\bclaras? de huevo\b/, "huevo"],
  [/\bbananos?\b|\bbananas?\b/, "banano"],
  [/\baguacates?\b/, "aguacate"],
  [/\balmendras?\b/, "almendras"],
  [/\bmanzanas?\b/, "manzana"],
  [/\bbrocoli\b/, "brocoli"],
  [/\bleche\b/, "leche"],
  [/\bpapas?\b/, "papa"],
  [/\btortillas? de maiz\b/, "tortilla-maiz"],
  [/\bpan\b/, "pan"],
  [/\baceite de oliva\b/, "aceite-oliva"],
];

export type FoodIllustration =
  | "proteina"
  | "pescado"
  | "lacteo"
  | "carbohidrato"
  | "grasa"
  | "fruta"
  | "legumbre"
  | "verdura"
  | "bebida"
  | "otro";

const GROUPS = new Set<FoodIllustration>([
  "proteina",
  "lacteo",
  "carbohidrato",
  "grasa",
  "fruta",
  "legumbre",
  "verdura",
  "bebida",
]);

export function normalizeFoodName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function foodVisual(food: {
  name: string;
  group?: string | null;
  imageUrl?: string | null;
}): { src: string | null; illustration: FoodIllustration } {
  const name = normalizeFoodName(food.name);
  const illustration: FoodIllustration =
    /\b(atun|pescado|salmon|tilapia|sardinas?|camarones?)\b/.test(name)
      ? "pescado"
      : GROUPS.has(food.group as FoodIllustration)
        ? (food.group as FoodIllustration)
        : "otro";
  if (food.imageUrl) return { src: food.imageUrl, illustration };
  const photo = PHOTOS.find(([pattern]) => pattern.test(name));
  return {
    src: photo ? `/foods/${photo[1]}.webp` : null,
    illustration,
  };
}
