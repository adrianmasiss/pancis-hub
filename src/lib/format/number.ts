/**
 * Cifras con espacio fino como separador de miles: `2 070`, no `2,070`.
 *
 * El lienzo v11 las escribe asi en todas las pantallas —la ingesta, el
 * objetivo, el rango de calorias del historial— y el motivo no es estetico:
 * en un tablero donde hay comas decimales ("36,2 kg" de masa magra), una coma
 * de miles hace que `2,070` se pueda leer como dos con setenta.
 *
 * El caracter es U+202F, espacio fino sin salto: no parte el numero al final
 * de una linea y no se ensancha con el interletrado del titular.
 */
const THIN = " ";

export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();

  // Por debajo de cinco cifras el lienzo agrupa igual (`2 070`), asi que se
  // agrupa desde cuatro y no desde cinco como haria `es-ES`.
  if (digits.length <= 3) return `${sign}${digits}`;

  const head = digits.length % 3 || 3;
  const groups = [digits.slice(0, head)];
  for (let i = head; i < digits.length; i += 3) {
    groups.push(digits.slice(i, i + 3));
  }
  return sign + groups.join(THIN);
}

/** Un decimal con coma, como "36,2". Para pesos y masas. */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace(".", ",");
}
