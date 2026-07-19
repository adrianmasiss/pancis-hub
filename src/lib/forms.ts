/**
 * Para react-hook-form register(..., { setValueAs: toOptionalNumber }):
 * convierte el valor del input a numero, o undefined si esta vacio,
 * de modo que Zod valide numeros reales sin NaN.
 */
export function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}
