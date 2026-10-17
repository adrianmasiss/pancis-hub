"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { loadExerciseCatalog } from "@/features/training/catalog-cache";
import { matchExercise } from "@/features/training/lib/exercise-matcher";
import {
  parseRoutineText,
  summarizeRoutine,
  type ParsedRoutine,
} from "@/features/training/lib/routine-parser";

const t = messages.training.import;

const MAX_TEXT = 20000;

const previewSchema = z.object({
  text: z.string().trim().min(3).max(MAX_TEXT),
});

const importSchema = z.object({
  name: z.string().trim().min(1).max(80),
  text: z.string().trim().min(3).max(MAX_TEXT),
  /** Correcciones a mano: «día-ejercicio» → id del catálogo. */
  overrides: z.record(z.string(), z.uuid()).optional(),
});

/** Ejercicio ya emparejado contra el catalogo, listo para revisar. */
export type ImportExercisePreview = {
  rawName: string;
  matchedId: string | null;
  matchedName: string | null;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  restSeconds: number | null;
  notes: string | null;
};

export type ImportPreview = {
  days: {
    name: string;
    note: string | null;
    exercises: ImportExercisePreview[];
  }[];
  notes: string[];
  ignoredLines: string[];
  dayCount: number;
  exerciseCount: number;
  /** Ejercicios sin equivalente en el catalogo; no se pueden importar. */
  unmatchedCount: number;
};

async function matchExercises(
  routine: ParsedRoutine,
  overrides: Record<string, string> = {},
): Promise<ImportPreview> {
  /* El catálogo ENTERO. Antes se pedían 500 filas de 2.207, y lo que no
     cayera en ellas no se podía encontrar aunque existiera. */
  const catalog = await loadExerciseCatalog();
  const byId = new Map(catalog.map((row) => [row.id, row]));

  let unmatchedCount = 0;
  const days = routine.days.map((day, d) => ({
    name: day.name,
    note: day.note,
    exercises: day.exercises.map((exercise, e) => {
      const forced = byId.get(overrides[`${d}-${e}`] ?? "");
      const match = forced
        ? { candidate: forced }
        : matchExercise(exercise.rawName, catalog);
      if (!match) unmatchedCount += 1;
      return {
        rawName: exercise.rawName,
        matchedId: match?.candidate.id ?? null,
        matchedName: match?.candidate.name ?? null,
        sets: exercise.sets,
        repsMin: exercise.repsMin,
        repsMax: exercise.repsMax,
        rir: exercise.rir,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      };
    }),
  }));

  const summary = summarizeRoutine(routine);
  return {
    days,
    notes: routine.notes,
    ignoredLines: routine.ignoredLines,
    dayCount: summary.dayCount,
    exerciseCount: summary.exerciseCount,
    unmatchedCount,
  };
}

/**
 * Analiza el texto y lo empareja contra el catalogo SIN guardar nada: el
 * usuario revisa antes. Importar a ciegas una rutina mal interpretada
 * seria peor que no importarla.
 */
export async function previewRoutineImport(
  input: unknown,
): Promise<{ error: string } | ImportPreview> {
  const parsed = previewSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const routine = parseRoutineText(parsed.data.text);
  if (routine.days.length === 0) return { error: t.nothingRecognized };

  return matchExercises(routine);
}

/**
 * Saca el texto de un PDF de rutina, para revisarlo en el mismo cuadro antes
 * de analizarlo. Sin IA y sin servicios externos: el PDF de un entrenador
 * trae texto, no hace falta adivinarlo.
 *
 * Las palabras se agrupan por renglón según su altura en la página; así
 * «1. Press inclinado barra 4x12» llega en una línea, como se ve impreso.
 */
export async function extractRoutinePdf(
  formData: FormData,
): Promise<{ error: string } | { text: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const file = formData.get("file");
  if (!user || !(file instanceof File)) return { error: t.failed };
  if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024)
    return { error: t.pdfInvalid };

  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
    }).promise;
    const lines: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const rows = new Map<number, [number, string][]>();
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        const row = rows.get(y) ?? [];
        row.push([item.transform[4], item.str]);
        rows.set(y, row);
      }
      for (const [, row] of [...rows].sort((a, b) => b[0] - a[0]))
        lines.push(
          row
            .sort((a, b) => a[0] - b[0])
            .map(([, str]) => str)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim(),
        );
    }
    const text = lines.join("\n").slice(0, MAX_TEXT);
    return text.trim() ? { text } : { error: t.pdfEmpty };
  } catch (error) {
    console.error("[rutinas] no se pudo leer el PDF", error);
    return { error: t.pdfInvalid };
  }
}

/**
 * Crea la rutina con lo que se pudo emparejar. Los ejercicios sin
 * equivalente en el catalogo se OMITEN: crear uno inventado ensuciaria el
 * catalogo compartido, y el usuario ya vio cuales quedan fuera.
 *
 * Las notas del entrenador se conservan: las generales y las de cada día van
 * a las notas de la rutina; las de cada ejercicio, a su ejercicio.
 */
export async function importRoutine(
  input: unknown,
): Promise<{ error: string } | { success: true; planId: string }> {
  const parsed = importSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const preview = await matchExercises(
    parseRoutineText(parsed.data.text),
    parsed.data.overrides,
  );
  if (preview.exerciseCount === 0) return { error: t.nothingRecognized };

  const planNotes = [
    ...preview.notes,
    ...preview.days
      .filter((day) => day.note)
      .map((day) => `${day.name}: ${day.note}`),
  ]
    .join("\n")
    .slice(0, 4000);

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      objective: null,
      notes: planNotes || null,
    })
    .select("id")
    .single();
  if (planError || !plan) return { error: t.failed };

  let dayIndex = 1;
  for (const day of preview.days) {
    const importable = day.exercises.filter((exercise) => exercise.matchedId);
    if (importable.length === 0) continue;

    const { data: createdDay, error: dayError } = await supabase
      .from("workout_plan_days")
      .insert({
        workout_plan_id: plan.id,
        day_index: dayIndex,
        name: day.name.slice(0, 80),
      })
      .select("id")
      .single();
    if (dayError || !createdDay) return { error: t.failed };
    dayIndex += 1;

    const { error: exercisesError } = await supabase
      .from("workout_plan_exercises")
      .insert(
        importable.map((exercise, position) => ({
          workout_plan_day_id: createdDay.id,
          exercise_id: exercise.matchedId!,
          position: position + 1,
          sets: exercise.sets,
          target_reps_min: exercise.repsMin,
          target_reps_max: exercise.repsMax,
          target_rir: exercise.rir,
          rest_seconds: exercise.restSeconds,
          // El nombre que escribió el entrenador va primero: es como lo
          // reconoce quien entrena, aunque el catálogo lo llame en inglés.
          notes:
            [
              exercise.rawName !== exercise.matchedName
                ? `«${exercise.rawName}»`
                : null,
              exercise.notes,
            ]
              .filter(Boolean)
              .join(" · ")
              .slice(0, 500) || null,
        })),
      );
    if (exercisesError) return { error: t.failed };
  }

  revalidatePath("/entrenamiento");
  return { success: true, planId: plan.id };
}
