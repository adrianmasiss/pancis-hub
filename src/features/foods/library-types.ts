import type { FoodGroup } from "./schemas";
import type { LibraryFood } from "./queries";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import type { ProviderSource } from "@/lib/food-providers/types";
import type { SourceAgreement } from "@/features/foods/lib/source-agreement";

export type LibraryCardFood = {
  key: string;
  foodId: string | null;
  /**
   * Proveedor del que viene, cuando no es de la biblioteca local.
   *
   * Antes aquí sólo cabía `dietlyId`, y eso ataba la tarjeta a un proveedor
   * concreto: la acción de guardar escribía «dietly» a mano y USDA y Open
   * Food Facts no podían compartir la misma lista. Con el par
   * proveedor + id externo la tarjeta sirve para los tres.
   */
  provider: ProviderSource | null;
  externalId: string | null;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  group: FoodGroup;
  cookedState: string | null;
  macros: { [K in keyof MacroSet]: number | null };
  source: string;
  /**
   * Qué dijo cada proveedor de este alimento, cuando hay más de uno.
   *
   * Sólo lo trae lo local: un resultado que acaba de llegar de un proveedor
   * no tiene con qué contrastarse todavía.
   */
  agreement: SourceAgreement | null;
  canUse: boolean;
  local?: LibraryFood;
  /** Sobre qué cantidad están `macros`; ausente = 100 g. */
  basis?: "100g" | "100ml";
  /** Gramos por mililitro, si está medido. */
  density?: number | null;
  /** Porciones caseras medidas, para medir en algo más que gramos. */
  portions?: { label: string; grams: number }[];
};
