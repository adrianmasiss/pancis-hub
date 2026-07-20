"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { ScaleField } from "@/components/shared/scale-field";
import { saveTodayCheckin } from "@/features/checkins/actions";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.checkins;

export type CheckinDefaults = {
  sleepHours: number | null;
  sleepQuality: number | null;
  hunger: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  mood: number | null;
  nutritionAdherence: number | null;
  trainingCompleted: boolean | null;
  notes: string | null;
};

const SCALE_FIELDS = [
  "sleepQuality",
  "hunger",
  "energy",
  "stress",
  "soreness",
  "mood",
  "nutritionAdherence",
] as const;

type ScaleKey = (typeof SCALE_FIELDS)[number];

export function CheckinForm({
  defaults,
}: {
  defaults: CheckinDefaults | null;
}) {
  const [sleepHours, setSleepHours] = useState(
    defaults?.sleepHours !== null && defaults !== null
      ? String(defaults.sleepHours)
      : "",
  );
  const [scales, setScales] = useState<Record<ScaleKey, number | undefined>>({
    sleepQuality: defaults?.sleepQuality ?? undefined,
    hunger: defaults?.hunger ?? undefined,
    energy: defaults?.energy ?? undefined,
    stress: defaults?.stress ?? undefined,
    soreness: defaults?.soreness ?? undefined,
    mood: defaults?.mood ?? undefined,
    nutritionAdherence: defaults?.nutritionAdherence ?? undefined,
  });
  const [trainingCompleted, setTrainingCompleted] = useState<
    boolean | undefined
  >(defaults?.trainingCompleted ?? undefined);
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const parsedSleep = sleepHours === "" ? undefined : Number(sleepHours);
      const result = await saveTodayCheckin({
        sleepHours: Number.isNaN(parsedSleep) ? undefined : parsedSleep,
        ...scales,
        trainingCompleted,
        notes: notes || undefined,
      });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.saved);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.todayTitle}</CardTitle>
        <CardDescription>{t.todayDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={t.fields.sleepHours}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(event) => setSleepHours(event.target.value)}
            />
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">
                {t.fields.trainingCompleted}
              </legend>
              <div className="grid grid-cols-2 gap-1">
                {[true, false].map((option) => (
                  <label
                    key={String(option)}
                    className={cn(
                      "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                      trainingCompleted === option
                        ? "bg-brand-button text-primary-foreground border-transparent"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name="training-completed"
                      checked={trainingCompleted === option}
                      onChange={() => setTrainingCompleted(option)}
                      className="sr-only"
                    />
                    {option ? t.fields.yes : t.fields.no}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SCALE_FIELDS.map((key) => (
              <ScaleField
                key={key}
                label={t.fields[key]}
                value={scales[key]}
                onChange={(value) =>
                  setScales((previous) => ({ ...previous, [key]: value }))
                }
              />
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="checkin-notes">
              {t.fields.notes}
            </label>
            <Textarea
              id="checkin-notes"
              value={notes}
              maxLength={300}
              rows={2}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
