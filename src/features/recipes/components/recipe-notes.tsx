"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateRecipeNotes } from "@/features/recipes/step-actions";
import { messages } from "@/i18n/es-419";

const t = messages.recipes.notes;

/**
 * Conservacion y meal prep (docs/02_PRODUCT_REQUIREMENTS.md 8).
 *
 * Son texto libre a proposito: "3 dias en refrigeracion" y "congelar en
 * porciones individuales" no encajan en un campo estructurado sin
 * inventar una taxonomia que el usuario tendria que aprender.
 */
export function RecipeNotes({
  recipeId,
  storageNotes,
  mealPrepNotes,
  canEdit,
}: {
  recipeId: string;
  storageNotes: string | null;
  mealPrepNotes: string | null;
  canEdit: boolean;
}) {
  const [storage, setStorage] = useState(storageNotes ?? "");
  const [mealPrep, setMealPrep] = useState(mealPrepNotes ?? "");
  const [pending, startTransition] = useTransition();

  const dirty = storage !== (storageNotes ?? "") || mealPrep !== (mealPrepNotes ?? "");

  if (!canEdit) {
    if (!storageNotes && !mealPrepNotes) return null;
    return (
      <section className="space-y-2">
        {storageNotes ? (
          <div>
            <h2 className="text-sm font-semibold">{t.storageTitle}</h2>
            <p className="text-muted-foreground text-sm">{storageNotes}</p>
          </div>
        ) : null}
        {mealPrepNotes ? (
          <div>
            <h2 className="text-sm font-semibold">{t.mealPrepTitle}</h2>
            <p className="text-muted-foreground text-sm">{mealPrepNotes}</p>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="recipe-storage">{t.storageTitle}</Label>
        <Textarea
          id="recipe-storage"
          rows={2}
          maxLength={500}
          value={storage}
          placeholder={t.storagePlaceholder}
          onChange={(event) => setStorage(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="recipe-mealprep">{t.mealPrepTitle}</Label>
        <Textarea
          id="recipe-mealprep"
          rows={2}
          maxLength={500}
          value={mealPrep}
          placeholder={t.mealPrepPlaceholder}
          onChange={(event) => setMealPrep(event.target.value)}
        />
      </div>
      {dirty ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateRecipeNotes({
                recipeId,
                storageNotes: storage,
                mealPrepNotes: mealPrep,
              });
              if ("error" in result) toast.error(result.error);
              else toast.success(t.saved);
            })
          }
        >
          {pending ? messages.common.loading : t.save}
        </Button>
      ) : null}
    </section>
  );
}
