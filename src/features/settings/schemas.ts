import { z } from "zod";
import { messages } from "@/i18n/es-419";

const t = messages.onboarding.errors;

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1, t.required),
  heightCm: z
    .number({ error: t.heightRange })
    .min(100, t.heightRange)
    .max(250, t.heightRange),
  unitSystem: z.enum(["metric", "imperial"], { error: t.required }),
  timezone: z.string().min(1, t.required),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;

/**
 * Objetivo y actividad viven aparte del resto del perfil porque son las dos
 * entradas de la formula: cambiarlas mueve las calorias y los macros. El
 * formulario los separa para que el efecto no sorprenda a nadie.
 */
export const goalSettingsSchema = z.object({
  primaryGoal: z.enum(
    ["recomposicion", "perdida_grasa", "ganancia_muscular", "mantenimiento"],
    { error: t.required },
  ),
  activityLevel: z.enum(["sedentario", "ligero", "moderado", "alto"], {
    error: t.required,
  }),
});

export type GoalSettingsInput = z.infer<typeof goalSettingsSchema>;

/**
 * Margen que el usuario acepta en cada macro.
 *
 * Son PREFERENCIAS suyas, no limites clinicos, y la interfaz tiene que
 * decirlo asi. El rango 1-50 replica el check de la migracion: por debajo de
 * 1 % ninguna sustitucion real entraria, y por encima de 50 % la tolerancia
 * deja de significar nada.
 */
const tolerancePct = z
  .number({ error: t.required })
  .min(1, t.toleranceRange)
  .max(50, t.toleranceRange);

export const toleranceSettingsSchema = z.object({
  caloriesPct: tolerancePct,
  proteinPct: tolerancePct,
  carbsPct: tolerancePct,
  fatPct: tolerancePct,
});

export type ToleranceSettingsInput = z.infer<typeof toleranceSettingsSchema>;
