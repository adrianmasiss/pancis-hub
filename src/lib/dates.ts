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

/**
 * Fecha de HOY (YYYY-MM-DD) en la zona horaria del perfil.
 *
 * En el servidor "hoy" nunca es la fecha del contenedor: a las 23:00 en Costa
 * Rica, UTC ya va por el dia siguiente, y un objetivo o una comida acabarian
 * fechados en el futuro. Se comprobo pasando de verdad: la primera version
 * de esta funcionalidad guardo un objetivo con fecha de manana.
 *
 * Si la zona no es valida cae a UTC, que es lo unico que siempre existe.
 */
export function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
