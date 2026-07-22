"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormField } from "@/components/shared/form-field";
import {
  getExerciseAlternatives,
  removePlanExercise,
  substitutePlanExercise,
  updatePlanExercise,
} from "@/features/training/actions";
import type { ExerciseAlternativeDetail } from "@/features/training/actions";
import {
  AskAboutButton,
  contextualQuestions,
} from "@/features/assistant/components/ask-about-button";
import { ExerciseDetailSheet } from "@/features/training/components/exercise-detail-sheet";
import type { PlanExerciseView } from "@/features/training/queries";
import { toOptionalNumber } from "@/lib/forms";
import { messages } from "@/i18n/es-419";

const t = messages.training;
const b = messages.training.biomechanics;

/** Bloque de comparacion; no se renderiza si no hay nada que decir. */
function ComparisonList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium">{title}</p>
      <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function targetSummary(exercise: PlanExerciseView): string {
  const parts: string[] = [];
  if (exercise.sets) {
    const reps =
      exercise.repsMin && exercise.repsMax
        ? `${exercise.repsMin}-${exercise.repsMax}`
        : (exercise.repsMin ?? exercise.repsMax ?? "");
    parts.push(`${exercise.sets}x${reps || "?"}`);
  }
  if (exercise.rir !== null) parts.push(`RIR ${exercise.rir}`);
  if (exercise.rpe !== null) parts.push(`RPE ${exercise.rpe}`);
  if (exercise.tempo) parts.push(`Tempo ${exercise.tempo}`);
  if (exercise.restSeconds) parts.push(`${exercise.restSeconds}s`);
  return parts.join(" · ");
}

export function PlanExerciseRow({ exercise }: { exercise: PlanExerciseView }) {
  const [editOpen, setEditOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<
    ExerciseAlternativeDetail[] | null
  >(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    sets: exercise.sets ?? undefined,
    repsMin: exercise.repsMin ?? undefined,
    repsMax: exercise.repsMax ?? undefined,
    rir: exercise.rir ?? undefined,
    rpe: exercise.rpe ?? undefined,
    tempo: exercise.tempo ?? "",
    restSeconds: exercise.restSeconds ?? undefined,
    notes: exercise.notes ?? "",
  });

  const loadAlternatives = async () => {
    const result = await getExerciseAlternatives({
      planExerciseId: exercise.id,
    });
    if ("error" in result) toast.error(result.error);
    else setAlternatives(result.alternatives);
  };

  const saveTargets = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updatePlanExercise({
        planExerciseId: exercise.id,
        ...form,
        tempo: form.tempo || undefined,
        notes: form.notes || undefined,
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.exerciseUpdated);
        setEditOpen(false);
      }
    });
  };

  const numberField = (
    key: "sets" | "repsMin" | "repsMax" | "rir" | "rpe" | "restSeconds",
    label: string,
    step = "1",
  ) => (
    <FormField
      label={label}
      type="number"
      inputMode="decimal"
      step={step}
      value={form[key] ?? ""}
      onChange={(event) =>
        setForm((previous) => ({
          ...previous,
          [key]: toOptionalNumber(event.target.value),
        }))
      }
    />
  );

  return (
    <li className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{exercise.name}</p>
        <p className="text-muted-foreground text-xs">
          {exercise.primaryMuscle}
          {targetSummary(exercise) ? ` · ${targetSummary(exercise)}` : ""}
        </p>
        {exercise.notes ? (
          <p className="text-muted-foreground text-xs italic">
            {exercise.notes}
          </p>
        ) : null}
      </div>
      <AskAboutButton
        question={contextualQuestions.exercise(exercise.name)}
        label={exercise.name}
      />
      <ExerciseDetailSheet
        planExerciseId={exercise.id}
        exerciseName={exercise.name}
      />
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground size-8"
        aria-label={`${t.substitute} — ${exercise.name}`}
        onClick={() => {
          setSwapOpen(true);
          void loadAlternatives();
        }}
      >
        <ArrowLeftRight className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground size-8"
        aria-label={`${messages.common.edit} — ${exercise.name}`}
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive size-8"
        disabled={pending}
        aria-label={`${messages.common.delete} — ${exercise.name}`}
        onClick={() =>
          startTransition(async () => {
            const result = await removePlanExercise({
              planExerciseId: exercise.id,
            });
            if ("error" in result) toast.error(result.error);
            else toast.success(t.exerciseRemoved);
          })
        }
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{exercise.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveTargets} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {numberField("sets", t.fields.sets)}
              {numberField("restSeconds", t.fields.restSeconds)}
              {numberField("repsMin", t.fields.repsMin)}
              {numberField("repsMax", t.fields.repsMax)}
              {numberField("rir", t.fields.rir, "0.5")}
              {numberField("rpe", t.fields.rpe, "0.5")}
            </div>
            <FormField
              label={t.fields.tempo}
              value={form.tempo}
              maxLength={20}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  tempo: event.target.value,
                }))
              }
            />
            <FormField
              label={t.fields.notes}
              value={form.notes}
              maxLength={300}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? messages.common.loading : messages.common.save}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet
        open={swapOpen}
        onOpenChange={(next) => {
          setSwapOpen(next);
          if (!next) setAlternatives(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t.substituteTitle}</SheetTitle>
            <SheetDescription>{t.substituteDescription}</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 overflow-y-auto px-4 pb-6">
            {alternatives === null ? (
              <p className="text-muted-foreground text-sm">
                {messages.common.loading}
              </p>
            ) : alternatives.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t.noAlternatives}
              </p>
            ) : (
              <ul className="space-y-2">
                {alternatives.map((alternative) => (
                  <li
                    key={alternative.exercise.id}
                    className="space-y-1.5 rounded-xl border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">
                        {alternative.exercise.name}
                      </span>
                      <span className="text-muted-foreground ml-auto text-sm font-semibold tabular-nums">
                        {alternative.compatibility}/10
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {alternative.exercise.primaryMuscle}
                      {alternative.exercise.equipment
                        ? ` · ${alternative.exercise.equipment}`
                        : ""}
                      {alternative.exercise.difficulty
                        ? ` · ${alternative.exercise.difficulty}`
                        : ""}
                    </p>

                    {/*
                      Nunca se ofrece una sustitucion sin explicarla: que
                      comparten, que se gana y que se pierde (requisito 12).
                    */}
                    <p className="text-xs">{alternative.recommendation}</p>

                    <ComparisonList
                      title={b.similarities}
                      items={alternative.similarities}
                    />
                    <ComparisonList
                      title={b.advantages}
                      items={alternative.advantages}
                    />
                    <ComparisonList
                      title={b.differences}
                      items={alternative.differences}
                    />
                    <ComparisonList
                      title={b.limitations}
                      items={alternative.limitations}
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await substitutePlanExercise({
                            planExerciseId: exercise.id,
                            newExerciseId: alternative.exercise.id,
                          });
                          if ("error" in result) toast.error(result.error);
                          else {
                            toast.success(t.exerciseUpdated);
                            setSwapOpen(false);
                          }
                        })
                      }
                    >
                      {t.substitute}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </li>
  );
}
