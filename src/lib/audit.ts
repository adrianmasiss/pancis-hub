/**
 * Registro del historial de cambios (docs/02_PRODUCT_REQUIREMENTS.md 22).
 *
 * Se escribe SIEMPRE con el cliente service role: si el navegador pudiera
 * insertar aqui, el historial dejaria de ser un registro confiable de lo
 * que realmente paso. El usuario solo puede leer sus propias entradas.
 *
 * Nunca lanza: un fallo registrando el historial no puede tumbar la
 * accion que lo origino. Se registra en consola y se sigue.
 *
 * SERVER-ONLY.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export const AUDIT_ACTIONS = [
  "alimento_sustituido",
  "comida_estado_cambiado",
  "ejercicio_sustituido",
  "alimento_importado",
  "alimento_corregido",
  "comida_sustituida_por_receta",
  "dieta_versionada",
  "dieta_restaurada",
  "rutina_versionada",
  "rutina_restaurada",
  "medicion_registrada",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ORIGINS = [
  "usuario",
  "ia",
  "sistema",
  "importacion",
] as const;

export type AuditOrigin = (typeof AUDIT_ORIGINS)[number];

export type AuditEntry = {
  actorUserId: string;
  action: AuditAction;
  /** Tabla o dominio afectado, ej. "meal_items". */
  entity: string;
  entityId: string | null;
  /** Valores antes del cambio; null si la entidad no existia. */
  previousValues?: Record<string, unknown> | null;
  /** Valores despues del cambio; null si se elimino. */
  newValues?: Record<string, unknown> | null;
  /** Por que se hizo, en lenguaje del usuario. */
  reason?: string | null;
  origin?: AuditOrigin;
};

export async function recordChange(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_user_id: entry.actorUserId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      previous_values: (entry.previousValues ?? null) as never,
      new_values: (entry.newValues ?? null) as never,
      reason: entry.reason ?? null,
      origin: entry.origin ?? "usuario",
    });
    if (error) {
      console.error("[audit] no se pudo registrar el cambio", entry.action, error);
    }
  } catch (error) {
    console.error("[audit] error inesperado", entry.action, error);
  }
}
