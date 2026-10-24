"use client";

import { useMobile } from "@/mobile/shell/mobile-shell";

const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

const num = (n: number, d: number) =>
  n.toLocaleString("es-CR", { maximumFractionDigits: d });

/**
 * Unidades de la vista movil, segun `profiles.unit_system`. Todo se guarda en
 * kg y cm; aqui solo se convierte para mostrar y para editar (los pasos del
 * stepper son de 5 lb en imperial y de 2,5 kg en metrico).
 */
export function useUnits() {
  const { units } = useMobile();
  const imperial = units === "imperial";
  return {
    imperial,
    weightUnit: imperial ? "lb" : "kg",
    lengthUnit: imperial ? "in" : "cm",
    /** Paso del stepper de peso, en la unidad mostrada. */
    weightStep: imperial ? 5 : 2.5,
    /** kg → cifra en la unidad del usuario. */
    weight: (kg: number) => (imperial ? kg * LB_PER_KG : kg),
    /** Cifra en la unidad del usuario → kg, para guardar. */
    toKg: (value: number) => (imperial ? value / LB_PER_KG : value),
    /** «82,5» o «181,9»: el peso ya convertido y formateado, sin unidad. */
    fmtWeight: (kg: number, d = 1) => num(imperial ? kg * LB_PER_KG : kg, d),
    /** «84» cm o «33,1» in. */
    fmtLength: (cm: number, d = 1) => num(imperial ? cm / CM_PER_IN : cm, d),
  };
}
