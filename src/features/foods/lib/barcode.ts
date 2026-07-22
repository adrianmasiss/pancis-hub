/**
 * Validacion de codigos de barras de producto (docs 7.8).
 *
 * EAN-13, EAN-8 y UPC-A llevan un digito verificador calculado desde los
 * anteriores. Comprobarlo antes de consultar sirve para dos cosas: no
 * gastar peticiones de Open Food Facts en lecturas erroneas, y distinguir
 * "el escaner leyo mal" de "el producto no esta en la base", que para el
 * usuario son problemas muy distintos.
 */

/** Solo digitos, sin espacios ni guiones. */
export function normalizeBarcode(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Digito verificador de EAN/UPC: se suman los digitos alternando pesos
 * 1 y 3 de derecha a izquierda, y el verificador es lo que falta para
 * llegar a la siguiente decena.
 */
export function checksumDigit(digitsWithoutCheck: string): number {
  let sum = 0;
  // De derecha a izquierda, el primero pesa 3.
  const reversed = [...digitsWithoutCheck].reverse();
  for (const [index, char] of reversed.entries()) {
    sum += Number(char) * (index % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/** Longitudes con verificador estandar. UPC-E (6) no lo lleva asi. */
const CHECKED_LENGTHS = new Set([8, 12, 13, 14]);

/**
 * true si el codigo es plausible. Los formatos sin verificador estandar
 * se aceptan por longitud: rechazarlos seria peor que consultarlos.
 */
export function isValidBarcode(value: string): boolean {
  const digits = normalizeBarcode(value);
  if (digits.length < 6 || digits.length > 14) return false;

  if (!CHECKED_LENGTHS.has(digits.length)) return true;

  const body = digits.slice(0, -1);
  const check = Number(digits.slice(-1));
  return checksumDigit(body) === check;
}

/**
 * Un UPC-A (12 digitos) es un EAN-13 con un cero delante. Open Food Facts
 * indexa la forma de 13, asi que se normaliza antes de consultar.
 */
export function toSearchableBarcode(value: string): string {
  const digits = normalizeBarcode(value);
  return digits.length === 12 ? `0${digits}` : digits;
}
