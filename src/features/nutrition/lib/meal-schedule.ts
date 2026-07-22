/**
 * Horarios de comida (docs/02_PRODUCT_REQUIREMENTS.md 4.1).
 *
 * El tipo de comida no basta para ordenar el dia: con dos o tres snacks
 * la etiqueta deja de distinguirlos. Aqui vive el orden real del dia y el
 * formato de la hora.
 */

/** Hora en formato HH:MM o HH:MM:SS tal como la devuelve Postgres. */
export type ScheduledTime = string | null;

export type SchedulableMeal = {
  scheduledTime: ScheduledTime;
  /** Desempate estable cuando dos comidas no tienen hora. */
  createdAt?: string;
};

/** Minutos desde medianoche, o null si la hora no es utilizable. */
export function toMinutes(time: ScheduledTime): number | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** "07:30:00" -> "7:30 a. m.", con el formato local del usuario. */
export function formatTime(time: ScheduledTime): string | null {
  const minutes = toMinutes(time);
  if (minutes === null) return null;
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat("es-419", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Ordena las comidas del dia por hora. Las que no tienen horario van al
 * FINAL y no al principio: sin hora no se puede afirmar que ocurran
 * primero, y colocarlas arriba desordenaria un dia bien planificado.
 */
export function sortBySchedule<T extends SchedulableMeal>(meals: T[]): T[] {
  return [...meals].sort((a, b) => {
    const timeA = toMinutes(a.scheduledTime);
    const timeB = toMinutes(b.scheduledTime);

    if (timeA !== null && timeB !== null) {
      if (timeA !== timeB) return timeA - timeB;
    } else if (timeA !== null) {
      return -1;
    } else if (timeB !== null) {
      return 1;
    }

    // Mismo horario o ninguno: se conserva el orden de creacion.
    return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
  });
}

/**
 * Siguiente comida pendiente segun la hora actual. Sirve para responder
 * "que me toca ahora" sin que el usuario tenga que buscarlo.
 *
 * Solo considera comidas con horario: sin hora no hay forma de saber si
 * ya paso su momento.
 */
export function nextScheduledMeal<T extends SchedulableMeal & { status?: string }>(
  meals: T[],
  nowMinutes: number,
): T | null {
  const pending = sortBySchedule(meals).filter((meal) => {
    if (meal.status && meal.status !== "planificada") return false;
    const minutes = toMinutes(meal.scheduledTime);
    return minutes !== null && minutes >= nowMinutes;
  });
  return pending[0] ?? null;
}

/** Minutos desde medianoche de una fecha, en hora local. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
