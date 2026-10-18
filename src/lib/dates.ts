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

/**
 * La fecha (YYYY-MM-DD) en que cae un instante en una zona horaria. Una
 * sesión que empezó a las 22:00 en Costa Rica es de ese día aunque en UTC ya
 * sea el siguiente.
 */
export function localDateOf(instant: string | Date, timezone: string): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const format = (timeZone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  try {
    return format(timezone);
  } catch {
    return format("UTC");
  }
}

/** Una fecha YYYY-MM-DD como medianoche UTC: aritmética sin husos. */
function utcOf(dateISO: string, plusDays = 0): Date {
  const [y = 1970, m = 1, d = 1] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + plusDays));
}

/** Suma días a una fecha YYYY-MM-DD, sin pasar por la zona del servidor. */
export function addDaysISO(dateISO: string, days: number): string {
  return utcOf(dateISO, days).toISOString().slice(0, 10);
}

/**
 * La semana de entrenamiento que contiene una fecha: de lunes a domingo,
 * ambos incluidos. Las fechas son de calendario, sin hora.
 */
export function weekBoundsISO(dateISO: string): { start: string; end: string } {
  // getUTCDay: 0 = domingo. El lunes queda 0 días atrás, el domingo 6.
  const offset = (utcOf(dateISO).getUTCDay() + 6) % 7;
  const start = addDaysISO(dateISO, -offset);
  return { start, end: addDaysISO(start, 6) };
}
