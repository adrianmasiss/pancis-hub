import { z } from "zod";

export const MEAL_TYPES = [
  "desayuno",
  "almuerzo",
  "cena",
  "snack",
  "otro",
] as const;

export const MEAL_STATUSES = [
  "planificada",
  "completada",
  // Se completo pero con sustituciones: suma igual al consumo del dia y
  // ademas explica por que el dia no cuadra con el plan original.
  "completada_con_cambios",
  "omitida",
] as const;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)));

/** Hora del dia HH:MM; vacio se trata como "sin horario". */
const scheduledTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createMealSchema = z.object({
  date: isoDate,
  mealType: z.enum(MEAL_TYPES),
  name: z.string().trim().max(80).optional(),
  scheduledTime,
});

export const mealIdSchema = z.object({ mealId: z.uuid() });

export const updateMealStatusSchema = z.object({
  mealId: z.uuid(),
  status: z.enum(MEAL_STATUSES),
});

export const updateMealTimeSchema = z.object({
  mealId: z.uuid(),
  scheduledTime,
});

export const updateMealNotesSchema = z.object({
  mealId: z.uuid(),
  notes: z.string().trim().max(500),
});

export const addMealItemSchema = z.object({
  mealId: z.uuid(),
  foodId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export const updateMealItemSchema = z.object({
  itemId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export const itemIdSchema = z.object({ itemId: z.uuid() });

export const duplicateDaySchema = z.object({
  fromDate: isoDate,
  toDate: isoDate,
});

export const searchFoodsSchema = z.object({
  term: z.string().trim().min(2).max(60),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type MealStatus = (typeof MEAL_STATUSES)[number];
export type MealType = (typeof MEAL_TYPES)[number];
