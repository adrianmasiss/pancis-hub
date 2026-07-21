"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getExerciseDetail,
  type ExerciseDetail,
} from "@/features/training/actions";
import { RESISTANCE_PROFILE_DESCRIPTIONS } from "@/features/training/lib/biomechanics";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.training.biomechanics;

/** El numero siempre va acompanado del motivo; el color no va solo. */
function scoreTone(score: number): string {
  if (score >= 8) return "text-primary";
  if (score >= 5) return "text-foreground";
  return "text-destructive";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Ficha del ejercicio: que trabaja, como se comporta la resistencia, como
 * ejecutarlo y como se valora en el contexto del usuario
 * (docs/02_PRODUCT_REQUIREMENTS.md 10-11).
 */
export function ExerciseDetailSheet({
  planExerciseId,
  exerciseName,
}: {
  planExerciseId: string;
  exerciseName: string;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);

  const load = async () => {
    const result = await getExerciseDetail({ planExerciseId });
    if ("error" in result) toast.error(result.error);
    else setDetail(result);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else setDetail(null);
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label={`${t.detailTitle} — ${exerciseName}`}
        >
          <Info className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{exerciseName}</SheetTitle>
          <SheetDescription>{t.detailDescription}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          {detail === null ? (
            <p className="text-muted-foreground text-sm">
              {messages.common.loading}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  {detail.exercise.primaryMuscle}
                </Badge>
                {detail.exercise.movementPattern ? (
                  <Badge variant="outline" className="font-normal">
                    {detail.exercise.movementPattern}
                  </Badge>
                ) : null}
                {detail.exercise.equipment ? (
                  <Badge variant="outline" className="font-normal">
                    {detail.exercise.equipment}
                  </Badge>
                ) : null}
                {detail.exercise.isUnilateral ? (
                  <Badge variant="outline" className="font-normal">
                    {t.unilateral}
                  </Badge>
                ) : null}
              </div>

              {detail.exercise.secondaryMuscles.length > 0 ? (
                <Section title={t.secondaryMuscles}>
                  <p className="text-muted-foreground text-xs">
                    {detail.exercise.secondaryMuscles.join(", ")}
                  </p>
                </Section>
              ) : null}

              {detail.exercise.joints.length > 0 ? (
                <Section title={t.joints}>
                  <p className="text-muted-foreground text-xs">
                    {detail.exercise.joints.join(", ")}
                  </p>
                </Section>
              ) : null}

              {detail.exercise.resistanceProfile ? (
                <Section title={t.resistanceProfile}>
                  <p className="text-muted-foreground text-xs">
                    {
                      RESISTANCE_PROFILE_DESCRIPTIONS[
                        detail.exercise.resistanceProfile
                      ]
                    }
                  </p>
                  {detail.exercise.hardestPoint ? (
                    <p className="text-muted-foreground text-xs">
                      <span className="font-medium">{t.hardestPoint}:</span>{" "}
                      {detail.exercise.hardestPoint}
                    </p>
                  ) : null}
                </Section>
              ) : null}

              {detail.setupNotes ? (
                <Section title={t.setup}>
                  <p className="text-muted-foreground text-xs">
                    {detail.setupNotes}
                  </p>
                </Section>
              ) : null}

              {detail.executionNotes ? (
                <Section title={t.execution}>
                  <p className="text-muted-foreground text-xs">
                    {detail.executionNotes}
                  </p>
                </Section>
              ) : null}

              <Section title={t.ratingsTitle}>
                <ul className="space-y-2">
                  {detail.ratings.map((rating) => (
                    <li key={rating.dimension} className="rounded-lg border p-2.5">
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        <span>{t.dimensions[rating.dimension]}</span>
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            scoreTone(rating.score),
                          )}
                        >
                          {rating.score}/10
                        </span>
                      </p>
                      {/* Nunca se muestra la nota sin explicar de donde sale. */}
                      <p className="text-muted-foreground text-xs">
                        {rating.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>

              {detail.exercise.techniqueCues.length > 0 ? (
                <Section title={t.cues}>
                  <BulletList items={detail.exercise.techniqueCues} />
                </Section>
              ) : null}

              {detail.exercise.commonErrors.length > 0 ? (
                <Section title={t.commonErrors}>
                  <BulletList items={detail.exercise.commonErrors} />
                </Section>
              ) : null}

              <p className="text-muted-foreground text-xs">{t.disclaimer}</p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
