/** Illustrative atlas for unbranded starter foods. Never a product photograph. */
import { normalizeText } from "@/lib/food-providers/classify";
const cells: Record<string, number> = {
  "aceite de oliva": 0,
  aguacate: 1,
  almendras: 2,
  "atun en agua": 5,
  "avena en hojuelas": 6,
  banano: 7,
  brocoli: 8,
  camote: 9,
  "clara de huevo": 10,
  "frijoles negros": 11,
  "huevo entero": 12,
  "leche descremada": 13,
  lentejas: 14,
  manzana: 15,
  "pan integral": 16,
  papa: 17,
  "pechuga de pollo": 18,
  "queso fresco": 19,
  "tortilla de maiz": 20,
  "yogur griego natural": 21,
};
export function foodIllustration(
  name: string,
  state: string | null,
  brand: string | null,
) {
  if (brand) return null;
  const key = normalizeText(name);
  // A cooked chicken illustration must not stand in for explicitly raw chicken.
  if (key === "pechuga de pollo" && state === "crudo") return null;
  const cell =
    key === "arroz blanco" ? (state === "cocido" ? 4 : 3) : cells[key];
  if (cell === undefined) return null;
  return {
    backgroundPosition: `${(cell % 6) * 20}% ${Math.floor(cell / 6) * (100 / 3)}%`,
  };
}
