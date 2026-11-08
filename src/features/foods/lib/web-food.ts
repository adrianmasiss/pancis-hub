import { z } from "zod";
import { FOOD_GROUPS } from "../schemas";

export const webSourceSchema = z.object({
  title: z.string(),
  url: z.url().refine((url) => /^https?:\/\//.test(url)),
});
export type WebFoodSource = z.infer<typeof webSourceSchema>;

/** Transcripción de una sola tabla/porción. Nunca completa huecos con estimaciones. */
export const webFoodReadingSchema = z.object({
  name: z.string().trim().min(1).max(80),
  brand: z.string().trim().max(60).nullable(),
  market: z.string(),
  foodGroup: z.enum(FOOD_GROUPS),
  identityClear: z.boolean(),
  conflicts: z.array(z.string()).max(10),
  basis: z.enum(["per100g", "per100ml", "serving_g", "unknown"]),
  amount: z.number().finite().nullable(),
  portionLabel: z.string().max(60).nullable(),
  calories: z.number().finite().nullable(),
  proteinG: z.number().finite().nullable(),
  carbohydrateG: z.number().finite().nullable(),
  fatG: z.number().finite().nullable(),
  fiberG: z.number().finite().nullable(),
  sugarG: z.number().finite().nullable(),
  sodiumMg: z.number().finite().nullable(),
  evidence: z
    .string()
    .max(8000)
    .describe(
      "Extracto literal del informe con la tabla nutricional y su porción",
    ),
  sourceIndices: z.array(z.number().int().nonnegative()).min(1).max(8),
  notes: z.array(z.string()).max(10),
});
export type WebFoodReading = z.infer<typeof webFoodReadingSchema>;

export type WebFoodResult = {
  status: "saved" | "existing" | "incomplete" | "unavailable";
  query: string;
  name?: string;
  foodId?: string;
  message: string;
  sources: WebFoodSource[];
  /** HTML del proveedor, mostrado sin scripts en un iframe aislado. */
  searchSuggestions?: string;
};

export const webProvenanceSchema = z.object({
  queriedAt: z.string(),
  query: z.string(),
  sources: z.array(webSourceSchema),
  reading: webFoodReadingSchema,
});
export type WebProvenance = z.infer<typeof webProvenanceSchema>;

export function normalizeFoodName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const HUNDRED_ML = /\b100\s*(ml|mililitros?)\b/i;
const HUNDRED_G = /\b100\s*(g|gr|gramos?)\b/i;
/** Productos que casi siempre se etiquetan por volumen. */
const LIQUID =
  /\b(leche|bebida|jugo|refresco|nectar|gaseosa|yogurt liquido|batido|te frio|cafe frio|agua)\b/;

/**
 * La lectura dice gramos pero la tabla citada habla de mililitros.
 *
 * Paso con la leche Dos Pinos (2026-11-08): la etiqueta es por 100 ml y la
 * transcripcion la dio por 100 g. Se decide con el texto citado, no con el
 * modelo: si solo aparece "100 ml", la base es 100 ml; si la porcion esta en
 * ml y su peso en gramos no figura, no hay conversion honesta posible.
 */
export function volumeBasis(
  reading: WebFoodReading,
): "per100ml" | "serving_ml" | "unclear" | null {
  const text = reading.evidence;
  if (reading.basis === "per100g" && !HUNDRED_G.test(text)) {
    if (HUNDRED_ML.test(text)) return "per100ml";
    const name = reading.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    // Una bebida "por 100 g" sin que la cita lo diga es casi siempre 100 ml.
    if (LIQUID.test(name)) return "unclear";
  }
  if (reading.basis === "serving_g" && reading.amount) {
    const n = String(reading.amount).replace(".", "[.,]");
    const inMl = new RegExp(`\\b${n}\\s*(ml|mililitros?)\\b`, "i");
    const inG = new RegExp(`\\b${n}\\s*(g|gr|gramos?)\\b`, "i");
    if (inMl.test(text) && !inG.test(text)) return "serving_ml";
  }
  return null;
}

export function prepareWebFood(
  reading: WebFoodReading,
  report: string,
  sources: WebFoodSource[],
) {
  const incomplete = (message: string) => ({
    status: "incomplete" as const,
    message,
  });
  if (
    !reading.identityClear ||
    normalizeFoodName(reading.market) !== "costarica"
  ) {
    return incomplete(
      "Falta confirmar el producto, su presentación o que los datos correspondan a Costa Rica.",
    );
  }
  if (reading.conflicts.length)
    return incomplete(`Las fuentes discrepan: ${reading.conflicts.join("; ")}`);
  if (
    !reading.evidence.trim() ||
    !reading.evidence
      .split("\n")
      .filter((line) => line.trim())
      .every((line) => report.includes(line)) ||
    !reading.sourceIndices.length ||
    reading.sourceIndices.some(
      (i) => !webSourceSchema.safeParse(sources[i]).success,
    )
  ) {
    return incomplete(
      "No pude vincular los nutrientes con una fuente de la búsqueda.",
    );
  }
  if (
    reading.basis === "unknown" ||
    (reading.basis === "serving_g" && (!reading.amount || reading.amount <= 0))
  ) {
    return incomplete(
      "Falta el peso de la porción; no puedo convertir los nutrientes a 100 g.",
    );
  }
  const volume = volumeBasis(reading);
  if (volume === "serving_ml")
    return incomplete(
      "La porción publicada está en mililitros y no trae su peso en gramos; no puedo convertirla sin suponer que 1 ml pesa 1 g.",
    );
  if (volume === "unclear")
    return incomplete(
      "No está claro si la tabla es por 100 g o por 100 ml, y en una bebida no son lo mismo. Una foto de la etiqueta lo resuelve.",
    );
  if (volume === "per100ml") reading = { ...reading, basis: "per100ml" };
  const required = [
    "calories",
    "proteinG",
    "carbohydrateG",
    "fatG",
    "fiberG",
  ] as const;
  const labels = {
    calories: "calorías",
    proteinG: "proteína",
    carbohydrateG: "carbohidratos",
    fatG: "grasa",
    fiberG: "fibra",
  };
  const missing = required.filter((key) => reading[key] === null);
  if (missing.length)
    return incomplete(
      `Faltan datos publicados de ${missing.map((key) => labels[key]).join(", ")}. Podés completar la ficha con una foto de la etiqueta.`,
    );
  // La extracción no puede introducir siquiera un número que no figure en
  // los fragmentos citados. La asociación nutriente/columna sigue siendo una
  // transcripción de IA, por eso la ficha nunca se marca como verificada.
  const publishedNumbers = new Set(
    (reading.evidence.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) =>
      Number(n.replace(",", ".")),
    ),
  );
  const copiedValues = [
    ...required.map((key) => reading[key]),
    reading.sugarG,
    reading.sodiumMg,
    ...(reading.basis === "serving_g" ? [reading.amount] : []),
  ];
  if (
    copiedValues.some((value) => value !== null && !publishedNumbers.has(value))
  ) {
    return incomplete(
      "La transcripción contiene cifras que no aparecen en los fragmentos citados. Hace falta revisar la etiqueta.",
    );
  }
  const factor = reading.basis === "serving_g" ? 100 / reading.amount! : 1;
  const convert = (value: number) => Math.round(value * factor * 10) / 10;
  const values = {
    calories: convert(reading.calories!),
    proteinG: convert(reading.proteinG!),
    carbohydrateG: convert(reading.carbohydrateG!),
    fatG: convert(reading.fatG!),
    fiberG: convert(reading.fiberG!),
    sugarG: reading.sugarG === null ? null : convert(reading.sugarG),
    sodiumMg: reading.sodiumMg === null ? null : convert(reading.sodiumMg),
  };
  if (
    Object.entries(values).some(
      ([key, value]) =>
        value !== null &&
        (!Number.isFinite(value) ||
          value < 0 ||
          value >
            (key === "calories" ? 900 : key === "sodiumMg" ? 40000 : 100)),
    ) ||
    values.proteinG + values.carbohydrateG + values.fatG > 105 ||
    values.fiberG > values.carbohydrateG + 1 ||
    (values.sugarG !== null && values.sugarG > values.carbohydrateG + 1)
  ) {
    return incomplete(
      "Los valores no son coherentes con la porción publicada. Hace falta revisar la etiqueta.",
    );
  }
  return {
    status: "ready" as const,
    values,
    nutritionBasis:
      reading.basis === "per100ml" ? ("100ml" as const) : ("100g" as const),
    portion:
      reading.basis === "serving_g" && reading.portionLabel
        ? { label: reading.portionLabel, grams: reading.amount! }
        : null,
    sources: [...new Set(reading.sourceIndices)].map((i) => sources[i]!),
  };
}
