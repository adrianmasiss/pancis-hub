import { addDaysISO } from "@/lib/dates";

/**
 * Racha: dias seguidos, hasta hoy o ayer, con algo registrado (comidas o
 * entreno). Hoy sin registro todavia no la rompe. La usan Perfil e Inicio,
 * asi que las dos muestran el mismo numero.
 */
export function streakDays(
  activeDates: Iterable<string>,
  today: string,
): number {
  const activos = new Set(activeDates);
  let racha = 0;
  let dia = activos.has(today) ? today : addDaysISO(today, -1);
  while (activos.has(dia)) {
    racha += 1;
    dia = addDaysISO(dia, -1);
  }
  return racha;
}
