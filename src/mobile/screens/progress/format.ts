import type { TrendDef } from "@/features/progress/lib/trends-view";
import type { useUnits } from "@/mobile/units";

type Units = ReturnType<typeof useUnits>;

export const num = (n: number, d = 1) =>
  n.toLocaleString("es-CR", { maximumFractionDigits: d });

/** «+0,4» / «−0,9» / «0»: con el signo de resta tipografico. */
export const signo = (n: number, d = 1) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n), d)}`;

/** «6 nov» / «6 nov 2025» si no es de este año. */
export function fechaCorta(iso: string, anio = false) {
  const d = new Date(`${iso}T12:00:00`);
  return d
    .toLocaleDateString("es-CR", {
      day: "numeric",
      month: "short",
      ...(anio ? { year: "numeric" } : {}),
    })
    .replace(".", "")
    .replace(/ de /g, " ");
}

/** La cifra de una metrica en la unidad del usuario (kg/lb, cm/in, %). */
export function enUnidad(u: Units, def: Pick<TrendDef, "unit">, v: number) {
  if (def.unit === "kg") return u.weight(v);
  if (def.unit === "cm") return u.imperial ? v / 2.54 : v;
  return v;
}

export function unidadDe(u: Units, def: Pick<TrendDef, "unit">) {
  if (def.unit === "kg") return u.weightUnit;
  if (def.unit === "cm") return u.lengthUnit;
  return def.unit;
}
