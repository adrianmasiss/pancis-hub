"use client";

import { useState, useTransition } from "react";
import { Check, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addSessionExercise,
  deleteSet,
  discardSession,
  finishSession,
  logSet,
} from "@/features/training/actions";
import { ExercisePicker } from "@/features/training/components/exercise-picker";
import type {
  SessionDetail,
  SessionSetView,
} from "@/features/training/queries";
import { sessionVolume } from "@/features/training/lib/stats";
import { toOptionalNumber } from "@/lib/forms";
import { messages } from "@/i18n/es-419";

const t = messages.training;

type SessionExercise = {
  exerciseId: string;
  name: string;
  target?: string;
};

function SetLogger({
  sessionId,
  exerciseId,
  lastSet,
}: {
  sessionId: string;
  exerciseId: string;
  lastSet?: SessionSetView;
}) {
  const [weight, setWeight] = useState(
    lastSet?.weightKg !== null && lastSet !== undefined
      ? String(lastSet.weightKg)
      : "",
  );
  const [reps, setReps] = useState(
    lastSet?.repetitions ? String(lastSet.repetitions) : "",
  );
  const [rir, setRir] = useState("");
  const [warmup, setWarmup] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await logSet({
        sessionId,
        exerciseId,
        isWarmup: warmup,
        weightKg: toOptionalNumber(weight),
        repetitions: toOptionalNumber(reps),
        rir: toOptionalNumber(rir),
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.setLogged);
        setWarmup(false);
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="w-20 space-y-1">
        <Label className="text-xs" htmlFor={`w-${exerciseId}`}>
          {t.fields.weightKg}
        </Label>
        <Input
          id={`w-${exerciseId}`}
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          className="h-8 tabular-nums"
        />
      </div>
      <div className="w-16 space-y-1">
        <Label className="text-xs" htmlFor={`r-${exerciseId}`}>
          {t.fields.reps}
        </Label>
        <Input
          id={`r-${exerciseId}`}
          type="number"
          inputMode="numeric"
          min="1"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
          className="h-8 tabular-nums"
        />
      </div>
      <div className="w-14 space-y-1">
        <Label className="text-xs" htmlFor={`rir-${exerciseId}`}>
          {t.fields.rir}
        </Label>
        <Input
          id={`rir-${exerciseId}`}
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          max="10"
          value={rir}
          onChange={(event) => setRir(event.target.value)}
          className="h-8 tabular-nums"
        />
      </div>
      <label className="flex h-8 items-center gap-1.5 text-xs">
        <Checkbox
          checked={warmup}
          onCheckedChange={(checked) => setWarmup(checked === true)}
        />
        {t.fields.warmup}
      </label>
      <Button type="submit" size="sm" className="h-8" disabled={pending}>
        <Check className="size-4" aria-hidden="true" />
        {t.addSet}
      </Button>
    </form>
  );
}

export function SessionView({ session }: { session: SessionDetail }) {
  const [extraExercises, setExtraExercises] = useState<SessionExercise[]>([]);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [notes, setNotes] = useState(session.notes ?? "");
  const [pending, startTransition] = useTransition();

  const setsByExercise = new Map<string, SessionSetView[]>();
  for (const set of session.sets) {
    const list = setsByExercise.get(set.exerciseId) ?? [];
    list.push(set);
    setsByExercise.set(set.exerciseId, list);
  }

  // Ejercicios visibles: los del plan + los registrados + los agregados.
  const exercises: SessionExercise[] = [];
  const seen = new Set<string>();
  for (const planned of session.plannedExercises) {
    seen.add(planned.exerciseId);
    const reps =
      planned.repsMin && planned.repsMax
        ? `${planned.repsMin}-${planned.repsMax}`
        : (planned.repsMin ?? planned.repsMax ?? "");
    exercises.push({
      exerciseId: planned.exerciseId,
      name: planned.name,
      target: planned.sets
        ? `${planned.sets}x${reps || "?"}${planned.rir !== null ? ` RIR ${planned.rir}` : ""}`
        : undefined,
    });
  }
  for (const set of session.sets) {
    if (!seen.has(set.exerciseId)) {
      seen.add(set.exerciseId);
      exercises.push({ exerciseId: set.exerciseId, name: set.exerciseName });
    }
  }
  for (const extra of extraExercises) {
    if (!seen.has(extra.exerciseId)) {
      seen.add(extra.exerciseId);
      exercises.push(extra);
    }
  }

  const volume = sessionVolume(
    session.sets.map((set) => ({
      exerciseId: set.exerciseId,
      isWarmup: set.isWarmup,
      weightKg: set.weightKg,
      repetitions: set.repetitions,
    })),
  );

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm tabular-nums">
        {t.volumeLabel}: {volume} {t.kgUnit} ·{" "}
        {session.sets.filter((set) => !set.isWarmup).length} {t.setsLabel}
      </p>

      {exercises.map((exercise) => {
        const sets = setsByExercise.get(exercise.exerciseId) ?? [];
        return (
          <Card key={exercise.exerciseId}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-baseline gap-2 text-base">
                {exercise.name}
                {exercise.target ? (
                  <span className="text-muted-foreground text-xs font-normal">
                    {t.targetLabel}: {exercise.target}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sets.length > 0 ? (
                <ul className="divide-y">
                  {sets.map((set) => (
                    <li
                      key={set.id}
                      className="flex items-center gap-2 py-1.5 text-sm"
                    >
                      <span className="text-muted-foreground w-14 text-xs">
                        {t.setLabel} {set.setNumber}
                      </span>
                      {set.isWarmup ? (
                        <Badge variant="outline" className="font-normal">
                          {t.warmupShort}
                        </Badge>
                      ) : null}
                      <span className="tabular-nums">
                        {set.weightKg ?? "—"} {t.kgUnit} ×{" "}
                        {set.repetitions ?? "—"}
                        {set.rir !== null ? ` · RIR ${set.rir}` : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive ml-auto size-7"
                        disabled={pending}
                        aria-label={`${messages.common.delete} — ${t.setLabel} ${set.setNumber}`}
                        onClick={() =>
                          startTransition(async () => {
                            const result = await deleteSet({ setId: set.id });
                            if ("error" in result) toast.error(result.error);
                            else toast.success(t.setDeleted);
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <SetLogger
                sessionId={session.id}
                exerciseId={exercise.exerciseId}
                lastSet={sets.filter((set) => !set.isWarmup).at(-1)}
              />
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <ExercisePicker
          onSelect={async (exercise) => {
            const result = await addSessionExercise({
              sessionId: session.id,
              exerciseId: exercise.id,
            });
            if ("error" in result) toast.error(result.error);
            else
              setExtraExercises((previous) => [
                ...previous,
                { exerciseId: result.exercise.id, name: result.exercise.name },
              ]);
          }}
        />
        <span className="flex-1" />
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setDiscardOpen(true)}
        >
          {t.discardSession}
        </Button>
        <Button onClick={() => setFinishOpen(true)}>
          <Flag className="size-4" aria-hidden="true" />
          {t.finishSession}
        </Button>
      </div>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.finishSession}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="session-notes">{t.sessionNotes}</Label>
            <Textarea
              id="session-notes"
              value={notes}
              maxLength={500}
              rows={3}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFinishOpen(false)}>
              {messages.common.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await finishSession({
                    sessionId: session.id,
                    notes,
                  });
                  if (result && "error" in result) toast.error(result.error);
                })
              }
            >
              {pending ? messages.common.loading : messages.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.discardSession}</DialogTitle>
            <DialogDescription>{t.discardSessionConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDiscardOpen(false)}>
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await discardSession({
                    sessionId: session.id,
                  });
                  if (result && "error" in result) toast.error(result.error);
                })
              }
            >
              {messages.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
