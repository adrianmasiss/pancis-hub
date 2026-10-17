/**
 * Sodio y azucar de un alimento registrado.
 *
 * A diferencia de calorias y macros, estos dos faltan a menudo en el
 * catalogo, y «no se sabe» no es «cero»: un cero inventado haria parecer
 * conocido y bajo algo que no se sabe. Por eso todo aqui devuelve `null`
 * cuando el dato no existe, y la interfaz solo lo muestra donde existe.
 */

type Num = number | string | null | undefined;

const round1 = (value: number) => Math.round(value * 10) / 10;

function known(value: Num): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Cantidad para `grams` a partir de un valor por 100 g. */
export function scaleExtra(per100g: Num, grams: number): number | null {
  const base = known(per100g);
  return base === null ? null : round1((base * grams) / 100);
}

/** Reescala una instantanea ya guardada a otra cantidad. */
export function rescaleExtra(
  snapshot: Num,
  fromGrams: number,
  toGrams: number,
): number | null {
  const base = known(snapshot);
  if (base === null || fromGrams <= 0) return null;
  return round1((base / fromGrams) * toGrams);
}
