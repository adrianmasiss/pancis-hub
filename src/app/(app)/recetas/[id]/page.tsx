import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { PageHeader } from "@/components/shared/page-header";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import { IngredientList } from "@/features/recipes/components/ingredient-list";
import { RecipeActions } from "@/features/recipes/components/recipe-actions";
import { RecipeFormDialog } from "@/features/recipes/components/recipe-form-dialog";
import { RecipeNotes } from "@/features/recipes/components/recipe-notes";
import { RecipeSteps } from "@/features/recipes/components/recipe-steps";
import { getRecipeDetail } from "@/features/recipes/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.recipes;

export const metadata: Metadata = { title: t.title };

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const recipe = await getRecipeDetail(user.id, id);
  if (!recipe) notFound();

  return (
    <>
      <FoodThumbnail
        src={recipe.imageUrl}
        alt={recipe.name}
        className="aspect-[21/9] w-full"
      />
      <PageHeader
        title={recipe.name}
        description={recipe.description ?? undefined}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/recetas">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t.title}
            </Link>
          </Button>
        }
      />

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <span>
          {recipe.servings} {t.servingsWord}
        </span>
        {recipe.preparationMinutes ? (
          <span className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden="true" />
            {recipe.preparationMinutes} min
          </span>
        ) : null}
        {recipe.difficulty ? (
          <span>
            {t.difficulties[recipe.difficulty as keyof typeof t.difficulties]}
          </span>
        ) : null}
        {recipe.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="font-normal">
            {tag}
          </Badge>
        ))}
        {recipe.allergens.length > 0 ? (
          <Badge variant="outline" className="gap-1 font-normal">
            <TriangleAlert className="size-3" aria-hidden="true" />
            {t.allergensLabel}: {recipe.allergens.join(", ")}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RecipeActions recipe={recipe} />
        {recipe.isOwn ? <RecipeFormDialog recipe={recipe} /> : null}
      </div>

      {/* Una columna, tambien en escritorio: ingredientes y macros no se
          comparan entre si, se leen uno despues del otro. */}
      <Section title={t.ingredientsTitle}>
        <IngredientList
          recipeId={recipe.id}
          ingredients={recipe.ingredients}
          editable={recipe.isOwn}
        />
      </Section>

      <Section title={t.macrosTitle}>
        <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {recipe.perServing.calories} {messages.nutrition.kcal}
                <span className="text-muted-foreground text-sm font-normal">
                  {" "}
                  {t.perServing}
                </span>
              </p>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <MacroChip type="protein" value={recipe.perServing.proteinG} variant="full" />
                <MacroChip type="carbs" value={recipe.perServing.carbohydrateG} variant="full" />
                <MacroChip type="fat" value={recipe.perServing.fatG} variant="full" />
                <MacroChip type="fiber" value={recipe.perServing.fiberG} variant="full" />
              </div>
            </div>
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
              <span>{t.totalRecipe}:</span>
              <MacroChip type="calories" value={recipe.totals.calories} />
              <MacroChip type="protein" value={recipe.totals.proteinG} />
              <MacroChip type="carbs" value={recipe.totals.carbohydrateG} />
              <MacroChip type="fat" value={recipe.totals.fatG} />
            </p>
        </div>
      </Section>

      <Section>
        <div className="space-y-6">
          <RecipeSteps
            recipeId={recipe.id}
            steps={recipe.steps}
            canEdit={recipe.isOwn}
            legacyInstructions={recipe.instructions}
          />
          <RecipeNotes
            recipeId={recipe.id}
            storageNotes={recipe.storageNotes}
            mealPrepNotes={recipe.mealPrepNotes}
            canEdit={recipe.isOwn}
          />
        </div>
      </Section>
    </>
  );
}
