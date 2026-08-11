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
