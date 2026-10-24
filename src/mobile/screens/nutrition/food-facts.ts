/**
 * «Qué aporta y qué no» de un alimento, por 100 g. Umbrales de las etiquetas
 * de semáforo (FSA del Reino Unido) y de las declaraciones de la UE: son
 * reglas fijas y conocidas, no una opinión de la app.
 */
import type { MicronutrientKey } from "@/features/foods/queries";

export type FoodFact = { text: string; tone: "ok" | "warn" | "neutral" };

/**
 * Vitaminas y minerales con su valor diario de referencia (FDA, etiquetado
 * 2016, adultos). La grasa saturada y el colesterol van con los macros.
 */
export const MICROS: {
  key: MicronutrientKey;
  label: string;
  unit: string;
  dv: number;
}[] = [
  { key: "calcium_mg", label: "Calcio", unit: "mg", dv: 1300 },
  { key: "iron_mg", label: "Hierro", unit: "mg", dv: 18 },
  { key: "magnesium_mg", label: "Magnesio", unit: "mg", dv: 420 },
  { key: "potassium_mg", label: "Potasio", unit: "mg", dv: 4700 },
  { key: "zinc_mg", label: "Zinc", unit: "mg", dv: 11 },
  { key: "vit_a_ug", label: "Vitamina A", unit: "µg", dv: 900 },
  { key: "vit_c_mg", label: "Vitamina C", unit: "mg", dv: 90 },
  { key: "vit_d_ug", label: "Vitamina D", unit: "µg", dv: 20 },
  { key: "vit_b12_ug", label: "Vitamina B12", unit: "µg", dv: 2.4 },
  { key: "folate_ug", label: "Folato", unit: "µg", dv: 400 },
];

export function foodFacts(f: {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
  sugarG?: number | null;
  sodiumMg?: number | null;
  micronutrients?: Partial<Record<MicronutrientKey, number>> | null;
}): FoodFact[] {
  const out: FoodFact[] = [];
  // Proteína: al menos el 20 % de las kcal (criterio UE de «alto en»).
  const protShare = f.calories > 0 ? (f.proteinG * 4) / f.calories : 0;
  if (f.proteinG >= 5 && protShare >= 0.2)
    out.push({ text: "Alto en proteína", tone: "ok" });
  if (f.fiberG >= 6) out.push({ text: "Alto en fibra", tone: "ok" });
  else if (f.fiberG >= 3) out.push({ text: "Fuente de fibra", tone: "ok" });

  // «Rico en»: 20 % o más del valor diario en 100 g (umbral de la FDA para
  // «alto en»). Sólo los tres mayores, para no llenar la ficha.
  const ricos = MICROS.map((m) => ({
    label: m.label,
    pct: (f.micronutrients?.[m.key] ?? 0) / m.dv,
  }))
    .filter((m) => m.pct >= 0.2)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  for (const m of ricos)
    out.push({
      text: `Rico en ${m.label.charAt(0).toLowerCase()}${m.label.slice(1)}`,
      tone: "ok",
    });

  if (f.sugarG != null && f.sugarG > 22.5)
    out.push({ text: "Alto en azúcar", tone: "warn" });
  if (f.fatG > 17.5) out.push({ text: "Alto en grasa", tone: "warn" });
  if (f.sodiumMg != null && f.sodiumMg > 600)
    out.push({ text: "Alto en sodio", tone: "warn" });
  if (f.calories >= 400) out.push({ text: "Muy calórico", tone: "warn" });

  if (f.calories >= 100 && f.proteinG < 2)
    out.push({ text: "Casi sin proteína", tone: "neutral" });
  if (f.carbohydrateG >= 20 && f.fiberG < 1)
    out.push({ text: "Sin fibra", tone: "neutral" });
  return out;
}
