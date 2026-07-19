import { z } from "zod";
import { messages } from "@/i18n/es-419";
import { calculateAge } from "@/features/onboarding/lib/nutrition-targets";

const t = messages.onboarding.errors;

/**
 * Los inputs numericos se registran con setValueAs: cadena vacia pasa a
 * undefined antes de validar, asi input y output del schema coinciden.
 */
function requiredNumber(min: number, max: number, message: string) {
  return z.number({ error: message }).min(min, message).max(max, message);
}

function optionalNumber(min: number, max: number, message: string) {
  return z
    .number({ error: message })
    .min(min, message)
    .max(max, message)
    .optional();
}

const optionalText = z.string().trim().optional();

export const basicsSchema = z.object({
  displayName: z.string().trim().min(1, t.required),
  birthDate: z
    .string()
    .min(1, t.required)
    .refine((value) => !Number.isNaN(Date.parse(value)), t.invalidDate)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      const age = calculateAge(date);
      return age >= 18 && age <= 120;
    }, t.adultRequired),
  biologicalSex: z.enum(["masculino", "femenino"], { error: t.required }),
  heightCm: requiredNumber(100, 250, t.heightRange),
  unitSystem: z.enum(["metric", "imperial"], { error: t.required }),
  timezone: z.string().min(1, t.required),
});

export const goalSchema = z.object({
  primaryGoal: z.enum(
    ["recomposicion", "perdida_grasa", "ganancia_muscular", "mantenimiento"],
    { error: t.required },
  ),
});

export const activitySchema = z.object({
  experienceLevel: z.enum(["principiante", "intermedio", "avanzado"], {
    error: t.required,
  }),
  trainingDaysPerWeek: requiredNumber(0, 7, t.required),
  trainingType: optionalText,
  activityLevel: z.enum(["sedentario", "ligero", "moderado", "alto"], {
    error: t.required,
  }),
  dailySteps: optionalNumber(0, 50000, t.stepsRange),
});

export const nutritionPreferencesSchema = z.object({
  allergies: optionalText,
  restrictions: optionalText,
  dislikedFoods: optionalText,
  mealsPerDay: requiredNumber(1, 10, t.required),
  usualTrainingTime: optionalText,
});

export const baselineSchema = z.object({
  weightKg: requiredNumber(30, 300, t.weightRange),
  bodyFatPercentage: optionalNumber(3, 60, t.percentRange),
  skeletalMuscleKg: optionalNumber(5, 100, t.weightRange),
  waistCm: optionalNumber(30, 250, t.required),
  measuredAt: z
    .string()
    .min(1, t.required)
    .refine((value) => !Number.isNaN(Date.parse(value)), t.invalidDate)
    .refine(
      (value) => new Date(`${value}T00:00:00`) <= new Date(),
      t.invalidDate,
    ),
  measurementSource: z.enum(["manual", "inbody", "bascula", "otro"], {
    error: t.required,
  }),
});

export const onboardingSchema = basicsSchema
  .extend(goalSchema.shape)
  .extend(activitySchema.shape)
  .extend(nutritionPreferencesSchema.shape)
  .extend(baselineSchema.shape);

export type BasicsInput = z.infer<typeof basicsSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type NutritionPreferencesInput = z.infer<
  typeof nutritionPreferencesSchema
>;
export type BaselineInput = z.infer<typeof baselineSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;

/** Convierte una lista separada por comas en valores limpios. */
export function parseCommaList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
