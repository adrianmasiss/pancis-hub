import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { IngredientList } from "@/features/recipes/components/ingredient-list";
import { RecipeActions } from "@/features/recipes/components/recipe-actions";
import { RecipeFormDialog } from "@/features/recipes/components/recipe-form-dialog";
import { getRecipeDetail } from "@/features/recipes/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.recipes;
const d = messages.dashboard.nutrition;

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.ingredientsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <IngredientList
              recipeId={recipe.id}
              ingredients={recipe.ingredients}
              editable={recipe.isOwn}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.macrosTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {recipe.perServing.calories} {messages.nutrition.kcal}
                <span className="text-muted-foreground text-sm font-normal">
                  {" "}
                  {t.perServing}
                </span>
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {d.protein} {recipe.perServing.proteinG} g · {d.carbs}{" "}
                {recipe.perServing.carbohydrateG} g · {d.fat}{" "}
                {recipe.perServing.fatG} g · {d.fiber}{" "}
                {recipe.perServing.fiberG} g
              </p>
            </div>
            <p className="text-muted-foreground text-xs tabular-nums">
              {t.totalRecipe}: {recipe.totals.calories}{" "}
              {messages.nutrition.kcal} · P {recipe.totals.proteinG} g · C{" "}
              {recipe.totals.carbohydrateG} g · G {recipe.totals.fatG} g
            </p>
          </CardContent>
        </Card>
      </div>

      {recipe.instructions ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.stepsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{recipe.instructions}</p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
