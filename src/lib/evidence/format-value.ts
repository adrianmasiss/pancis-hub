/**
 * Formatea el `value` jsonb de `formula_versions` para leerlo.
 *
 * Vive aqui y no en `src/server/tools/evidence.ts` porque la pantalla de
 * Evidencia lo necesita en el cliente, y ese modulo importa el cliente de
 * Supabase de servidor: importarlo desde un componente cliente dependia de que
 * el tree-shaking quitara esa dependencia. Compilaba, pero por suerte, no por
 * diseno.
 *
 * Es una funcion pura: sin red, sin `next/headers`, sin estado.
 */
export function formatValue(value: unknown, preferKey?: string | null): string {
  if (typeof value === "number" || typeof value === "string")
    return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (preferKey && preferKey in record) return formatValue(record[preferKey]);
    const entries = Object.entries(value as Record<string, unknown>);
    const isRange =
      entries.length === 2 &&
      "min" in (value as object) &&
      "max" in (value as object);
    if (isRange) {
      const v = value as { min: number; max: number };
      return `${v.min} a ${v.max}`;
    }
    return entries
      .map(([k, v]) =>
        v && typeof v === "object" && "min" in (v as object)
          ? `${k} ${(v as { min: number; max: number }).min} a ${(v as { min: number; max: number }).max}`
          : `${k} ${String(v)}`,
      )
      .join(", ");
  }
  return "";
}
