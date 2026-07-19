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
