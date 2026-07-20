"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { createRecipe, updateRecipe } from "@/features/recipes/actions";
import type { RecipeDetail } from "@/features/recipes/queries";
import { messages } from "@/i18n/es-419";

const t = messages.recipes;
const NO_DIFFICULTY = "none";

export function RecipeFormDialog({ recipe }: { recipe?: RecipeDetail }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const difficulty = String(formData.get("difficulty") ?? "");
    const payload = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      servings: Number(formData.get("servings")),
      preparationMinutes: formData.get("preparationMinutes")
        ? Number(formData.get("preparationMinutes"))
        : undefined,
      difficulty:
        difficulty && difficulty !== NO_DIFFICULTY
          ? (difficulty as "facil" | "media" | "dificil")
          : undefined,
      instructions: String(formData.get("instructions") ?? "") || undefined,
      tags: String(formData.get("tags") ?? "") || undefined,
      allergens: String(formData.get("allergens") ?? "") || undefined,
    };
    startTransition(async () => {
      const result = recipe
        ? await updateRecipe({ ...payload, recipeId: recipe.id })
        : await createRecipe(payload);
      if (result && "error" in result) toast.error(result.error);
      else {
        toast.success(recipe ? t.updated : t.created);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {recipe ? (
          <Button variant="outline" size="sm">
            <Pencil className="size-4" aria-hidden="true" />
            {t.editRecipe}
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden="true" />
            {t.createRecipe}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? t.editRecipe : t.createRecipe}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            label={t.fields.name}
            name="name"
            required
            maxLength={100}
            defaultValue={recipe?.name ?? ""}
          />
          <FormField
            label={t.fields.description}
            name="description"
            maxLength={500}
            defaultValue={recipe?.description ?? ""}
          />
          <div className="grid grid-cols-3 gap-3">
            <FormField
              label={t.fields.servings}
              name="servings"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0.5"
              required
              defaultValue={recipe?.servings ?? 2}
            />
            <FormField
              label={t.fields.preparationMinutes}
              name="preparationMinutes"
              type="number"
              inputMode="numeric"
              min="1"
              defaultValue={recipe?.preparationMinutes ?? ""}
            />
            <SelectField
              label={t.fields.difficulty}
              name="difficulty"
              options={[
                { value: NO_DIFFICULTY, label: "—" },
                { value: "facil", label: t.difficulties.facil },
                { value: "media", label: t.difficulties.media },
                { value: "dificil", label: t.difficulties.dificil },
              ]}
              defaultValue={recipe?.difficulty ?? NO_DIFFICULTY}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recipe-instructions">{t.fields.instructions}</Label>
            <Textarea
              id="recipe-instructions"
              name="instructions"
              rows={5}
              maxLength={4000}
              defaultValue={recipe?.instructions ?? ""}
            />
          </div>
          <FormField
            label={t.fields.tags}
            name="tags"
            help={t.fields.tagsHelp}
            maxLength={200}
            defaultValue={recipe?.tags.join(", ") ?? ""}
          />
          <FormField
            label={t.fields.allergens}
            name="allergens"
            help={t.fields.allergensHelp}
            maxLength={200}
            defaultValue={recipe?.allergens.join(", ") ?? ""}
          />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
