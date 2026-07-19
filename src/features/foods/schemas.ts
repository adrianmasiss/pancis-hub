import { z } from "zod";
import { messages } from "@/i18n/es-419";

const t = messages.foods.errors;

export const FOOD_GROUPS = [
  "proteina",
  "carbohidrato",
  "grasa",
  "lacteo",
  "fruta",
  "verdura",
  "legumbre",
  "bebida",
  "mixto",
  "otro",
] as const;

export const FOOD_VIEWS = ["todos", "favoritos", "mios", "recientes"] as const;

const macro = (max: number) =>
  z.number({ error: t.range }).min(0, t.range).max(max, t.range);

export const foodFormSchema = z.object({
  name: z.string().trim().min(1, t.required).max(80),
  brand: z.string().trim().max(60).optional(),
  foodGroup: z.enum(FOOD_GROUPS, { error: t.required }),
  cookedState: z.enum(["crudo", "cocido"]).optional(),
  calories: macro(900),
  proteinG: macro(100),
  carbohydrateG: macro(100),
  fatG: macro(100),
  fiberG: macro(100),
});

export const updateFoodSchema = foodFormSchema.extend({
  foodId: z.uuid(),
});

export const foodIdSchema = z.object({ foodId: z.uuid() });

export type FoodFormInput = z.infer<typeof foodFormSchema>;
export type FoodGroup = (typeof FOOD_GROUPS)[number];
export type FoodView = (typeof FOOD_VIEWS)[number];
