import { z } from "zod";
import { FOOD_GROUPS, type FoodGroup } from "@/features/foods/schemas";

/**
 * What a nutrition label says, as printed. The model only transcribes: it
 * reports the basis the column is written in (per 100 g, per 100 ml or per
 * serving) and the serving size, and the conversion to "per 100 g" happens
 * here, in code we can test, not in the model's head.
 */
export const labelReadingSchema = z.object({
  isNutritionLabel: z
    .boolean()
    .describe("false if the image is not a nutrition facts table"),
  name: z
    .string()
    .nullable()
    .describe("product name if visible on the package, else null"),
  brand: z.string().nullable().describe("brand if visible, else null"),
  foodGroup: z
    .enum(FOOD_GROUPS)
    .nullable()
    .describe(
      "best food group for the product from its name, or null if unclear: proteina, carbohidrato (cereals, bread, biscuits, rice, pasta), grasa, lacteo, fruta, verdura, legumbre, bebida, mixto (prepared dishes), otro",
    ),
  basis: z
    .enum(["per100g", "per100ml", "perServing"])
    .describe("which column the numbers below were read from"),
  servingSizeG: z
    .number()
    .nullable()
    .describe("serving size in grams (or ml) when basis is perServing"),
  calories: z.number().nullable().describe("energy in kcal, not kJ"),
  proteinG: z.number().nullable(),
  carbohydrateG: z.number().nullable().describe("total carbohydrate"),
  fatG: z.number().nullable().describe("total fat"),
  fiberG: z.number().nullable(),
  sugarG: z.number().nullable().describe("total sugars"),
  sodiumMg: z
    .number()
    .nullable()
    .describe("sodium in mg; if only salt is printed, salt g × 400"),
});

export type LabelReading = z.infer<typeof labelReadingSchema>;

export type LabelValues = {
  name: string | null;
  brand: string | null;
  /** A suggestion from the name, not something printed: the form shows it
   *  selected and the person can change it. */
  foodGroup: FoodGroup | null;
  calories: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

export type LabelResult =
  | { error: string }
  | {
      values: LabelValues;
      /** How the label was written, so the sheet can say what it did. */
      basis: LabelReading["basis"];
      servingSizeG: number | null;
    };

const round = (value: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

/**
 * Brings a reading to "per 100 g", the unit of the whole catalogue.
 *
 * Per-serving values scale by 100 / serving. Without a serving size they
 * cannot be converted honestly, so it fails rather than guess. Per 100 ml is
 * kept as is: the catalogue has no density, and for the drinks that print
 * per 100 ml the difference is a few percent; the sheet says so.
 */
export function labelToPer100g(
  reading: LabelReading,
): { error: string } | { values: LabelValues } {
  if (!reading.isNutritionLabel) {
    return {
      error:
        "No encontramos una tabla nutricional en la imagen. Prueba con una foto más cercana de la etiqueta.",
    };
  }
  let factor = 1;
  if (reading.basis === "perServing") {
    const serving = reading.servingSizeG;
    if (!serving || serving <= 0) {
      return {
        error:
          "La etiqueta da valores por porción pero no se lee de cuántos gramos es. Escribe los datos a mano.",
      };
    }
    factor = 100 / serving;
  }
  const scale = (value: number | null, digits = 1) =>
    value === null || !Number.isFinite(value) || value < 0
      ? null
      : round(value * factor, digits);
  const values: LabelValues = {
    name: reading.name?.trim() || null,
    brand: reading.brand?.trim() || null,
    foodGroup: reading.foodGroup ?? null,
    calories: scale(reading.calories, 0),
    proteinG: scale(reading.proteinG),
    carbohydrateG: scale(reading.carbohydrateG),
    fatG: scale(reading.fatG),
    fiberG: scale(reading.fiberG),
    sugarG: scale(reading.sugarG),
    sodiumMg: scale(reading.sodiumMg, 0),
  };
  const core = [
    values.calories,
    values.proteinG,
    values.carbohydrateG,
    values.fatG,
  ];
  if (core.every((value) => value === null)) {
    return {
      error:
        "La imagen no deja leer las calorías ni los macros. Prueba con otra foto o escríbelos a mano.",
    };
  }
  return { values };
}
