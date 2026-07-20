import { z } from "zod";
import { messages } from "@/i18n/es-419";

const t = messages.onboarding.errors;

const optionalRange = (min: number, max: number) =>
  z.number().min(min).max(max).optional();

export const MEASUREMENT_SOURCES = [
  "manual",
  "inbody",
  "bascula",
  "onboarding",
  "otro",
] as const;

export const measurementSchema = z.object({
  measuredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, t.invalidDate)
    .refine(
      (value) => new Date(`${value}T00:00:00`) <= new Date(),
      t.invalidDate,
    ),
  source: z.enum(MEASUREMENT_SOURCES),
  weightKg: optionalRange(30, 300),
  bodyFatPercentage: optionalRange(1, 75),
  skeletalMuscleKg: optionalRange(5, 100),
  waistCm: optionalRange(30, 250),
  hipCm: optionalRange(30, 250),
  chestCm: optionalRange(30, 250),
  armCm: optionalRange(10, 100),
  thighCm: optionalRange(20, 120),
  visceralFatLevel: optionalRange(0, 60),
  bodyWaterPercentage: optionalRange(1, 90),
  notes: z.string().trim().max(300).optional(),
});

export const updateMeasurementSchema = measurementSchema.extend({
  measurementId: z.uuid(),
});

export const measurementIdSchema = z.object({ measurementId: z.uuid() });

export const PHOTO_VIEWS = ["frontal", "lateral", "posterior"] as const;

export const photoMetaSchema = z.object({
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t.invalidDate),
  viewType: z.enum(PHOTO_VIEWS),
  notes: z.string().trim().max(200).optional(),
});

export const photoIdSchema = z.object({ photoId: z.uuid() });

export type MeasurementInput = z.infer<typeof measurementSchema>;
export type MeasurementSource = (typeof MEASUREMENT_SOURCES)[number];
export type PhotoView = (typeof PHOTO_VIEWS)[number];
