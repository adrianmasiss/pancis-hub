"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addRecipeStep,
  moveRecipeStep,
  removeRecipeStep,
} from "@/features/recipes/step-actions";
import type { RecipeStepView } from "@/features/recipes/queries";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.recipes.steps;

/**
 * Pasos numerados de la receta (docs/02_PRODUCT_REQUIREMENTS.md 8).
 *
 * El marcado de "hecho" es local a la sesion de cocina y NO se guarda:
 * es un apoyo mientras cocinas, no un dato del historial. Persistirlo
 * obligaria a limpiarlo antes de volver a cocinar la misma receta.
 */
export function RecipeSteps({
  recipeId,
  steps,
  canEdit,
  legacyInstructions,
}: {
  recipeId: string;
  steps: RecipeStepView[];
  canEdit: boolean;
  legacyInstructions: string | null;
}) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (stepId: string) => {
    setDone((previous) => {
      const next = new Set(previous);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const run = (
    action: () => Promise<{ error: string } | { success: true }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const result = await action();
      if ("error" in result) toast.error(result.error);
      else toast.success(successMessage);
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-semibold">{t.title}</h2>
        {steps.length > 0 ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {t.progress
              .replace("{done}", String(done.size))
              .replace("{total}", String(steps.length))}
          </span>
        ) : null}
      </div>

      {steps.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.empty}</p>
      ) : (
        <ol className="space-y-1.5">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="flex items-start gap-2 rounded-lg border p-2.5"
            >
              <label className="flex flex-1 cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0"
                  checked={done.has(step.id)}
                  onChange={() => toggle(step.id)}
                  aria-label={`${t.done} — ${step.instruction}`}
                />
                <span className="text-muted-foreground text-sm tabular-nums">
                  {step.position}.
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    done.has(step.id) && "text-muted-foreground line-through",
                  )}
                >
                  {step.instruction}
                </span>
              </label>

              {canEdit ? (
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-7"
                    disabled={pending || index === 0}
                    aria-label={`${t.moveUp} ${step.position}`}
                    onClick={() =>
                      run(
                        () =>
                          moveRecipeStep({
                            stepId: step.id,
                            direction: "arriba",
                          }),
                        t.updated,
                      )
                    }
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-7"
                    disabled={pending || index === steps.length - 1}
                    aria-label={`${t.moveDown} ${step.position}`}
                    onClick={() =>
                      run(
                        () =>
                          moveRecipeStep({
                            stepId: step.id,
                            direction: "abajo",
                          }),
                        t.updated,
                      )
                    }
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-7"
                    disabled={pending}
                    aria-label={`${t.remove} ${step.position}`}
                    onClick={() =>
                      run(
                        () => removeRecipeStep({ stepId: step.id }),
                        t.removed,
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {canEdit ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            run(
              () => addRecipeStep({ recipeId, instruction: draft }),
              t.added,
            );
            setDraft("");
          }}
        >
          <Input
            value={draft}
            maxLength={500}
            placeholder={t.placeholder}
            aria-label={t.add}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            <Plus className="size-4" aria-hidden="true" />
            {t.add}
          </Button>
        </form>
      ) : null}

      {/*
        El texto original se conserva: si la division automatica en pasos
        quedo mal, el contenido sigue estando a la vista.
      */}
      {legacyInstructions && steps.length > 0 ? (
        <details className="text-muted-foreground text-xs">
          <summary className="cursor-pointer">{t.legacyNotice}</summary>
          <p className="mt-1 whitespace-pre-line">{legacyInstructions}</p>
        </details>
      ) : null}
    </section>
  );
}
