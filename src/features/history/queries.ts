import { createClient } from "@/lib/supabase/server";
import type { AuditAction, AuditOrigin } from "@/lib/audit";

export type ChangeEntry = {
  id: string;
  createdAt: string;
  action: AuditAction;
  entity: string | null;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  reason: string | null;
  origin: AuditOrigin;
};

/**
 * Historial de cambios del usuario (docs/02_PRODUCT_REQUIREMENTS.md 22).
 *
 * Se lee con el cliente normal: la policy de audit_logs deja ver solo las
 * entradas propias. Nada se borra automaticamente.
 */
export async function getChangeHistory(
  userId: string,
  limit = 60,
): Promise<ChangeEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select(
      "id, created_at, action, entity, previous_values, new_values, reason, origin",
    )
    .eq("actor_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    action: row.action as AuditAction,
    entity: row.entity,
    previousValues: row.previous_values as Record<string, unknown> | null,
    newValues: row.new_values as Record<string, unknown> | null,
    reason: row.reason,
    origin: (row.origin as AuditOrigin) ?? "usuario",
  }));
}
