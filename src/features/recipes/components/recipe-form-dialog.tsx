"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChoicePills,
  FormGroup,
  MetricField,
} from "@/components/shared/form-kit";
import { createRecipe, updateRecipe } from "@/features/recipes/actions";
import type { RecipeDetail } from "@/features/recipes/queries";
import { messages } from "@/i18n/es-419";

const t = messages.recipes;
const NO_DIFFICULTY = "none";

export function RecipeFormDialog({ recipe }: { recipe?: RecipeDetail }) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<string>(
    recipe?.difficulty ?? NO_DIFFICULTY,
  );
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
          <ActionButton family="edit">{t.editRecipe}</ActionButton>
        ) : (
          // La accion prominente de Recetas. Editar, en cambio, es una accion
          // sobre una receta concreta y se queda callada.
          <ActionButton family="add">{t.createRecipe}</ActionButton>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipe ? t.editRecipe : t.createRecipe}</DialogTitle>
          <DialogDescription>{t.form.hint}</DialogDescription>
        </DialogHeader>
        <form id="recipe-form" onSubmit={onSubmit} className="grid gap-3">
          <FormGroup title={t.form.basics}>
            <MetricField
              type="text"
              label={t.fields.name}
              name="name"
              required
              maxLength={100}
              placeholder={t.form.namePlaceholder}
              defaultValue={recipe?.name ?? ""}
            />
            <MetricField
              type="text"
              label={t.form.description}
              name="description"
              maxLength={500}
              placeholder={messages.common.optional}
              defaultValue={recipe?.description ?? ""}
            />
            <div className="pc-metrics" data-pair="">
              <MetricField
                label={t.fields.servings}
                unit={t.form.servingsUnit}
                name="servings"
                step="0.5"
                min="0.5"
                required
                defaultValue={recipe?.servings ?? 2}
              />
              <MetricField
                label={t.form.time}
                unit="min"
                name="preparationMinutes"
                inputMode="numeric"
                min="1"
                defaultValue={recipe?.preparationMinutes ?? ""}
              />
            </div>
            <ChoicePills
              name="difficulty"
              label={t.fields.difficulty}
              options={[
                { value: NO_DIFFICULTY, label: t.form.noDifficulty },
                { value: "facil", label: t.difficulties.facil },
                { value: "media", label: t.difficulties.media },
                { value: "dificil", label: t.difficulties.dificil },
              ]}
              value={difficulty}
              onChange={setDifficulty}
            />
          </FormGroup>

          <FormGroup title={t.fields.instructions}>
            <textarea
              aria-label={t.fields.instructions}
              name="instructions"
              rows={5}
              maxLength={4000}
              className="pc-textarea"
              placeholder={t.form.stepsPlaceholder}
              defaultValue={recipe?.instructions ?? ""}
            />
          </FormGroup>

          <FormGroup
            collapsible
            defaultOpen={Boolean(
              recipe?.tags.length || recipe?.allergens.length,
            )}
            filled={
              (recipe?.tags.length ?? 0) + (recipe?.allergens.length ?? 0)
            }
            title={t.form.labels}
            hint={t.form.labelsHint}
          >
            <MetricField
              type="text"
              label={t.fields.tags}
              name="tags"
              maxLength={200}
              placeholder={t.fields.tagsHelp}
              defaultValue={recipe?.tags.join(", ") ?? ""}
            />
            <MetricField
              type="text"
              label={t.fields.allergens}
              name="allergens"
              maxLength={200}
              placeholder={t.fields.allergensHelp}
              defaultValue={recipe?.allergens.join(", ") ?? ""}
            />
          </FormGroup>
        </form>
        <DialogFooter>
          <ActionButton
            family="save"
            loading={pending}
            className="w-full"
            type="submit"
            form="recipe-form"
            disabled={pending}
          >
            {messages.common.save}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
