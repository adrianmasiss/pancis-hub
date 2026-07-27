import { z } from "zod";
import { PROVIDER_SOURCES } from "@/lib/food-providers/types";
import { FOOD_GROUPS } from "@/features/foods/schemas";

/** Agregar un alimento ya existente en el catalogo a la despensa. */
export const addPantryFoodSchema = z.object({ foodId: z.uuid() });

/**
 * Agregar un alimento externo (USDA / Open Food Facts) a la despensa. Se
 * importa primero al catalogo re-pidiendo los macros al proveedor (nunca se
 * confia en valores del cliente) y luego se agrega.
 */
export const addExternalPantryFoodSchema = z.object({
  source: z.enum(PROVIDER_SOURCES),
  externalId: z.string().trim().min(1).max(64),
  displayName: z.string().trim().min(1).max(80).optional(),
  foodGroup: z.enum(FOOD_GROUPS).optional(),
});

export const removePantryFoodSchema = z.object({ foodId: z.uuid() });

export type AddPantryFoodInput = z.infer<typeof addPantryFoodSchema>;
export type RemovePantryFoodInput = z.infer<typeof removePantryFoodSchema>;
