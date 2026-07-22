"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { pickBestMatch } from "@/lib/name-matching";
import {
  parseRoutineText,
  summarizeRoutine,
  type ParsedRoutine,
} from "@/features/training/lib/routine-parser";

const t = messages.training.import;

const previewSchema = z.object({
  text: z.string().trim().min(3).max(8000),
});

const importSchema = z.object({
  name: z.string().trim().min(1).max(80),
  text: z.string().trim().min(3).max(8000),
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
};

export type ImportPreview = {
  days: { name: string; exercises: ImportExercisePreview[] }[];
  ignoredLines: string[];
  dayCount: number;
  exerciseCount: number;
  /** Ejercicios sin equivalente en el catalogo; no se pueden importar. */
  unmatchedCount: number;
};

async function matchExercises(routine: ParsedRoutine): Promise<ImportPreview> {
  const supabase = await createClient();
  const { data: catalog } = await supabase
    .from("exercise_catalog")
    .select("id, name")
    .is("deleted_at", null)
    .limit(500);

  const candidates = (catalog ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  let unmatchedCount = 0;

  const days = routine.days.map((day) => ({
    name: day.name,
    exercises: day.exercises.map((exercise) => {
      const match = pickBestMatch(exercise.rawName, candidates);
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
      };
    }),
  }));

  const summary = summarizeRoutine(routine);
  return {
    days,
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
 * Crea la rutina con lo que se pudo emparejar. Los ejercicios sin
 * equivalente en el catalogo se OMITEN: crear uno inventado ensuciaria el
 * catalogo compartido, y el usuario ya vio cuales quedan fuera.
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

  const preview = await matchExercises(parseRoutineText(parsed.data.text));
  if (preview.exerciseCount === 0) return { error: t.nothingRecognized };

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      objective: null,
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
        name: day.name,
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
        })),
      );
    if (exercisesError) return { error: t.failed };
  }

  revalidatePath("/entrenamiento");
  return { success: true, planId: plan.id };
}
