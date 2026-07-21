/**
 * Contrato comun de proveedores externos de alimentos.
 *
 * La aplicacion nunca toca la forma cruda de una respuesta: cada proveedor
 * normaliza a NormalizedFood, con nutrientes SIEMPRE por 100 g, que es la
 * unidad en que el catalogo local guarda todo (docs/DATABASE.md).
 */
import type { FoodGroup } from "@/features/foods/schemas";
import type { MacroSet } from "@/features/nutrition/lib/macros";

export const PROVIDER_SOURCES = ["usda", "openfoodfacts"] as const;
export type ProviderSource = (typeof PROVIDER_SOURCES)[number];

export type NormalizedPortion = {
  label: string;
  grams: number;
  householdMeasure: string | null;
};

export type NormalizedFood = {
  source: ProviderSource;
  /** fdcId en USDA, code de barras en Open Food Facts. */
  externalId: string;
  /** Nombre mostrable; en espanol cuando el proveedor lo entrega. */
  name: string;
  /** Nombre original del proveedor, para trazabilidad. */
  externalName: string;
  brand: string | null;
  barcode: string | null;
  imageUrl: string | null;
  foodGroup: FoodGroup;
  cookedState: "crudo" | "cocido" | null;
  per100g: MacroSet;
  sugarG: number | null;
  sodiumMg: number | null;
  sourceUpdatedAt: string | null;
  portions: NormalizedPortion[];
  /** Alias de busqueda en espanol derivados del nombre. */
  aliases: string[];
};

export interface FoodProvider {
  readonly source: ProviderSource;
  /** Nombre visible del proveedor, para mostrar el origen del dato. */
  readonly label: string;
  searchFoods(query: string, signal?: AbortSignal): Promise<NormalizedFood[]>;
  getFoodById(
    externalId: string,
    signal?: AbortSignal,
  ): Promise<NormalizedFood | null>;
  getFoodByBarcode?(
    barcode: string,
    signal?: AbortSignal,
  ): Promise<NormalizedFood | null>;
  /** true si el proveedor tiene la configuracion necesaria para operar. */
  isAvailable(): boolean;
}

/**
 * Descarta datos inservibles o imposibles antes de que lleguen a la UI.
 * Un alimento sin calorias no sirve para planificar, y la suma de macros
 * no puede exceder 100 g por cada 100 g de producto (se deja un margen de
 * 5 g por redondeos y errores menores del proveedor).
 */
export function isPlausibleFood(food: NormalizedFood): boolean {
  const { calories, proteinG, carbohydrateG, fatG, fiberG } = food.per100g;
  if (!Number.isFinite(calories) || calories <= 0 || calories > 900)
    return false;
  if ([proteinG, carbohydrateG, fatG, fiberG].some((v) => !Number.isFinite(v)))
    return false;
  if ([proteinG, carbohydrateG, fatG, fiberG].some((v) => v < 0)) return false;
  if (proteinG + carbohydrateG + fatG > 105) return false;
  return food.name.trim().length > 0;
}
