import { Cable, Cog, Dumbbell, PersonStanding, Weight } from "lucide-react";
import type { PlanExerciseView } from "../queries";

/** Formatos compartidos por «Hoy» y el historial. */

export const kg = (n: number) =>
  `${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(n)} kg`;

export const numero = (n: number, decimals = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: decimals }).format(n);

export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* El catálogo escribe los músculos sin tilde («gluteos»); en pantalla van
   bien escritos. */
const TILDES: Record<string, string> = {
  gluteos: "glúteos",
  gluteo: "glúteo",
  cuadriceps: "cuádriceps",
  biceps: "bíceps",
  triceps: "tríceps",
};
export const musculo = (s: string) =>
  TILDES[s.toLowerCase()] ?? s.toLowerCase();

/** «hoy», «ayer», «hace 6 días», «hace 3 semanas». */
export function hace(iso: string): string {
  const dias = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(iso.slice(0, 10))) / 86400000),
  );
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.round(dias / 7)} semanas`;
  return `hace ${Math.round(dias / 30)} meses`;
}

/** «mié 8 oct 2026». */
export const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

/** «Isquiotibiales, glúteos y hombros». */
export function enumerar(lista: string[]): string {
  if (lista.length <= 1) return lista[0] ?? "";
  return `${lista.slice(0, -1).join(", ")} y ${lista.at(-1)}`;
}

/** Los músculos de un día, en el orden en que se entrenan, sin repetir. */
export function musculosDelDia(exercises: PlanExerciseView[]): string[] {
  return [
    ...new Set(exercises.map((e) => e.primaryMuscle).filter(Boolean)),
  ].map(musculo);
}

export function reps(e: PlanExerciseView): string {
  if (e.repsMin === null && e.repsMax === null) return "—";
  return e.repsMin === e.repsMax || e.repsMax === null
    ? String(e.repsMin)
    : `${e.repsMin ?? "—"}–${e.repsMax}`;
}

export function descanso(seconds: number | null): string | null {
  if (!seconds) return null;
  if (seconds < 60) return `desc. ${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `desc. ${m}:${String(s).padStart(2, "0")} min` : `desc. ${m} min`;
}

/** El icono del equipo: barra y mancuernas, polea, máquina, cuerpo… */
export function EquipmentIcon({ equipment }: { equipment: string | null }) {
  const e = (equipment ?? "").toLowerCase();
  const props = { size: 20, strokeWidth: 1.6, "aria-hidden": true } as const;
  if (/polea|cable/.test(e)) return <Cable {...props} />;
  if (/m[aá]quina|smith/.test(e)) return <Cog {...props} />;
  if (/corporal|peso del cuerpo|ninguno/.test(e))
    return <PersonStanding {...props} />;
  if (/kettlebell|pesa rusa|disco/.test(e)) return <Weight {...props} />;
  return <Dumbbell {...props} />;
}
