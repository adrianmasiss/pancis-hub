/**
 * Fecha de HOY en la zona horaria local del navegador (YYYY-MM-DD).
 * Nunca usar toISOString().slice(0,10) para "hoy" en cliente: eso da la
 * fecha UTC, que cerca de medianoche puede ser el dia siguiente.
 */
export function todayLocalISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
