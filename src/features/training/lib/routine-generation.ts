/**
 * Rutinas generadas por IA: el cuestionario, los candidatos que se le ofrecen
 * y la validación de lo que devuelve. Todo puro, para probarlo sin la IA.
 *
 * La IA sólo puede elegir ejercicios de la lista que se le da (por su
 * referencia corta), y lo que devuelve se recorta a rangos con evidencia
 * antes de guardar: nunca se guarda un número inventado fuera de rango.
 */
import { z } from "zod";
import { GRUPOS_MUSCULARES } from "./library-groups";

export const OBJETIVOS = [
  { id: "hipertrofia", label: "Ganar músculo", short: "Músculo" },
  { id: "fuerza", label: "Ganar fuerza", short: "Fuerza" },
  { id: "recomposicion", label: "Recomposición", short: "Recomposición" },
  { id: "resistencia", label: "Resistencia", short: "Resistencia" },
] as const;

export const NIVELES = [
  { id: "principiante", label: "Principiante" },
  { id: "intermedio", label: "Intermedio" },
  { id: "avanzado", label: "Avanzado" },
] as const;

/** Equipo del cuestionario → valores del catálogo. */
export const EQUIPOS = [
  {
    id: "gimnasio",
    label: "Gimnasio completo",
    catalogo: [
      "barra",
      "mancuernas",
      "polea",
      "maquina",
      "kettlebell",
      "banda",
      "balon",
      "cuerda",
      "rueda",
      "rodillo",
    ],
  },
  { id: "mancuernas", label: "Mancuernas", catalogo: ["mancuernas"] },
  { id: "barra", label: "Barra y discos", catalogo: ["barra"] },
  {
    id: "maquinas",
    label: "Máquinas y poleas",
    catalogo: ["maquina", "polea"],
  },
  { id: "kettlebell", label: "Kettlebell", catalogo: ["kettlebell"] },
  { id: "bandas", label: "Bandas", catalogo: ["banda"] },
] as const;

export const questionnaireSchema = z.object({
  goal: z.enum(["hipertrofia", "fuerza", "recomposicion", "resistencia"]),
  daysPerWeek: z.number().int().min(3).max(6),
  level: z.enum(["principiante", "intermedio", "avanzado"]),
  equipment: z
    .array(
      z.enum([
        "gimnasio",
        "mancuernas",
        "barra",
        "maquinas",
        "kettlebell",
        "bandas",
      ]),
    )
    .max(6),
  limitations: z.string().trim().max(300).default(""),
  emphasis: z
    .array(z.enum(GRUPOS_MUSCULARES.map((g) => g.id) as [string, ...string[]]))
    .max(4),
});

export type Questionnaire = z.infer<typeof questionnaireSchema>;

export type GenerationCandidate = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string | null;
  difficulty: string | null;
};

/** El catálogo que se ofrece: lo que permite el equipo y el nivel. */
export function pickCandidates(
  catalog: readonly GenerationCandidate[],
  q: Pick<Questionnaire, "equipment" | "level">,
  perMuscle = 12,
): GenerationCandidate[] {
  const permitidos = new Set<string>(
    q.equipment.flatMap(
      (id) => EQUIPOS.find((e) => e.id === id)?.catalogo ?? [],
    ),
  );
  const sirve = (c: GenerationCandidate) =>
    (c.equipment === null ||
      c.equipment === "peso corporal" ||
      permitidos.has(c.equipment)) &&
    !(q.level === "principiante" && c.difficulty === "avanzado");

  const porMusculo = new Map<string, GenerationCandidate[]>();
  for (const c of catalog) {
    if (!sirve(c)) continue;
    const lista = porMusculo.get(c.primaryMuscle) ?? [];
    if (lista.length < perMuscle) lista.push(c);
    porMusculo.set(c.primaryMuscle, lista);
  }
  return [...porMusculo.values()].flat();
}

/** Lo que devuelve la IA, con referencias cortas («e12») a los candidatos. */
export const generatedRoutineSchema = z.object({
  name: z.string().describe("Nombre corto de la rutina, en español"),
  notes: z
    .string()
    .describe("Dos o tres líneas: cómo progresar y cómo calentar"),
  days: z.array(
    z.object({
      focus: z.string().describe("Enfoque del día: «Espalda y bíceps»"),
      exercises: z.array(
        z.object({
          ref: z.string(),
          sets: z.number(),
          repsMin: z.number(),
          repsMax: z.number(),
          rir: z.number(),
          restSeconds: z.number(),
          notes: z.string().nullable(),
        }),
      ),
    }),
  ),
});

export type GeneratedRoutine = z.infer<typeof generatedRoutineSchema>;

export type ValidatedRoutine = {
  name: string;
  notes: string;
  days: {
    focus: string;
    exercises: {
      exerciseId: string;
      sets: number;
      repsMin: number;
      repsMax: number;
      rir: number;
      restSeconds: number;
      notes: string | null;
    }[];
  }[];
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(n)));

/**
 * Deja sólo lo que se puede guardar: referencias que existen, sin repetir un
 * ejercicio en el mismo día, y números dentro de rangos razonables. Devuelve
 * null si no queda una rutina con el número de días pedido.
 */
export function validateGenerated(
  raw: GeneratedRoutine,
  refs: ReadonlyMap<string, string>,
  daysPerWeek: number,
): ValidatedRoutine | null {
  const days = raw.days
    .map((day) => {
      const vistos = new Set<string>();
      const exercises = day.exercises.flatMap((e) => {
        const id = refs.get(e.ref.trim());
        if (!id || vistos.has(id)) return [];
        vistos.add(id);
        const repsMin = clamp(e.repsMin, 3, 25);
        return [
          {
            exerciseId: id,
            sets: clamp(e.sets, 1, 6),
            repsMin,
            repsMax: Math.max(repsMin, clamp(e.repsMax, 3, 30)),
            rir: Math.min(4, Math.max(0, Math.round(e.rir * 2) / 2)),
            restSeconds: clamp(e.restSeconds, 60, 300),
            // Las referencias («e127») son de la lista, no para el usuario.
            notes:
              e.notes
                ?.replace(/\s*\(?\be\d+\b\)?/g, "")
                .trim()
                .slice(0, 300) || null,
          },
        ];
      });
      return {
        focus: day.focus.trim().slice(0, 80) || "Entrenamiento",
        exercises: exercises.slice(0, 9),
      };
    })
    .filter((day) => day.exercises.length >= 3);

  if (days.length !== daysPerWeek) return null;
  return {
    name: raw.name.trim().slice(0, 80) || "Rutina generada",
    notes: raw.notes.trim().slice(0, 1000),
    days,
  };
}
