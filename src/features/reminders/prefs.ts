import { z } from "zod";

/*
  Preferencias de notificaciones por tipo, guardadas en
  `profiles.notification_prefs`. Lo que falte o no sea valido toma el valor
  por defecto: un perfil sin preferencias recibe lo mismo que antes (comidas
  a su hora y entreno a las 17:00).
*/

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const notificationPrefsSchema = z.object({
  comidas: z.object({
    on: z.boolean(),
    /** Minutos antes de la hora del plan. */
    antes: z.union([z.literal(0), z.literal(15), z.literal(30)]),
  }),
  entreno: z.object({ on: z.boolean(), hora }),
  agua: z.object({ on: z.boolean(), hora }),
  /** Fin del descanso entre series: aviso local del telefono, sin servidor. */
  descanso: z.object({ on: z.boolean() }),
  semanal: z.object({
    on: z.boolean(),
    /** 0 = domingo … 6 = sabado. */
    dia: z.number().int().min(0).max(6),
    hora,
  }),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  comidas: { on: true, antes: 0 },
  entreno: { on: true, hora: "17:00" },
  agua: { on: false, hora: "15:00" },
  descanso: { on: true },
  semanal: { on: false, dia: 0, hora: "19:00" },
};

/** Lee lo guardado tipo por tipo: un tipo mal formado no tumba los demas. */
export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_NOTIFICATION_PREFS };
  for (const key of Object.keys(out) as (keyof NotificationPrefs)[]) {
    const parsed = notificationPrefsSchema.shape[key].safeParse({
      ...DEFAULT_NOTIFICATION_PREFS[key],
      ...(obj[key] && typeof obj[key] === "object" ? obj[key] : {}),
    });
    if (parsed.success) (out as Record<string, unknown>)[key] = parsed.data;
  }
  return out;
}
