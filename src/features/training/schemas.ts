import { z } from "zod";

const optionalPositive = (max: number) =>
  z.number().positive().max(max).optional();

export const createPlanSchema = z.object({
  name: z.string().trim().min(1).max(80),
  objective: z.string().trim().max(200).optional(),
});

export const planIdSchema = z.object({ planId: z.uuid() });

export const addDaySchema = z.object({
  planId: z.uuid(),
  name: z.string().trim().max(60).optional(),
});

export const dayIdSchema = z.object({ dayId: z.uuid() });

export const addPlanExerciseSchema = z.object({
  dayId: z.uuid(),
  exerciseId: z.uuid(),
});

export const updatePlanExerciseSchema = z.object({
  planExerciseId: z.uuid(),
  sets: z.number().int().min(1).max(20).optional(),
  repsMin: z.number().int().min(1).max(100).optional(),
  repsMax: z.number().int().min(1).max(100).optional(),
  rir: z.number().min(0).max(10).optional(),
  rpe: z.number().min(1).max(10).optional(),
  tempo: z.string().trim().max(20).optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
  notes: z.string().trim().max(300).optional(),
});

export const planExerciseIdSchema = z.object({ planExerciseId: z.uuid() });

/**
 * Sustitucion PERMANENTE del ejercicio en el plan.
 *
 * `confirmPlanRewrite` no tiene valor por defecto a proposito: reescribir la
 * rutina base tiene que ser una decision explicita del usuario. La accion por
 * defecto de la UI es la sustitucion por un dia
 * (`training/day-swap-actions.ts`), que no destruye nada.
 */
export const substitutePlanExerciseSchema = z.object({
  planExerciseId: z.uuid(),
  newExerciseId: z.uuid(),
  confirmPlanRewrite: z.literal(true),
});

export const startSessionSchema = z.object({
  planId: z.uuid().optional(),
  planDayId: z.uuid().optional(),
});

export const sessionIdSchema = z.object({ sessionId: z.uuid() });

export const finishSessionSchema = z.object({
  sessionId: z.uuid(),
  notes: z.string().trim().max(500).optional(),
});

export const logSetSchema = z.object({
  sessionId: z.uuid(),
  exerciseId: z.uuid(),
  isWarmup: z.boolean(),
  weightKg: optionalPositive(1000),
  repetitions: z.number().int().positive().max(200).optional(),
  rir: z.number().min(0).max(10).optional(),
  rpe: z.number().min(1).max(10).optional(),
  tempo: z.string().trim().max(20).optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
  notes: z.string().trim().max(200).optional(),
});

export const setIdSchema = z.object({ setId: z.uuid() });

export const addSessionExerciseSchema = z.object({
  sessionId: z.uuid(),
  exerciseId: z.uuid(),
});

export const searchExercisesSchema = z.object({
  term: z.string().trim().min(2).max(60),
});
