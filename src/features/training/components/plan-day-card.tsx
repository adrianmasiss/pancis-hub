"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addPlanExercise, deletePlanDay } from "@/features/training/actions";
import { ExercisePicker } from "@/features/training/components/exercise-picker";
import { PlanExerciseRow } from "@/features/training/components/plan-exercise-row";
import type { PlanDayView } from "@/features/training/queries";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export function PlanDayCard({ day }: { day: PlanDayView }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {day.name || `${t.dayLabel} ${day.dayIndex}`}
          <span className="ml-auto" />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            disabled={pending}
            aria-label={`${t.deleteDay} — ${day.name ?? day.dayIndex}`}
            onClick={() =>
              startTransition(async () => {
                const result = await deletePlanDay({ dayId: day.id });
                if ("error" in result) toast.error(result.error);
                else toast.success(t.dayDeleted);
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {day.exercises.length > 0 ? (
          <ul className="divide-y">
            {day.exercises.map((exercise) => (
              <PlanExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </ul>
        ) : null}
        <ExercisePicker
          onSelect={async (exercise) => {
            const result = await addPlanExercise({
              dayId: day.id,
              exerciseId: exercise.id,
            });
            if ("error" in result) toast.error(result.error);
            else toast.success(t.exerciseAdded);
          }}
        />
      </CardContent>
    </Card>
  );
}
