import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChefHat, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import { RecipeFormDialog } from "@/features/recipes/components/recipe-form-dialog";
import { getRecipes, type RecipeFilters } from "@/features/recipes/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.recipes;

export const metadata: Metadata = { title: t.title };

const VIEWS = ["all", "mine", "highProtein", "quick"] as const;
const VIEW_LABELS: Record<(typeof VIEWS)[number], string> = {
  all: t.filters.all,
  mine: t.filters.mine,
  highProtein: t.filters.highProtein,
  quick: t.filters.quick,
};

function buildHref(params: { q?: string; vista?: string }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.vista && params.vista !== "all") search.set("vista", params.vista);
  const qs = search.toString();
  return `/recetas${qs ? `?${qs}` : ""}`;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vista?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const view: RecipeFilters["view"] = VIEWS.includes(
    params.vista as (typeof VIEWS)[number],
  )
    ? (params.vista as RecipeFilters["view"])
    : "all";

  const recipes = await getRecipes(user.id, { query, view });

  return (
    <>
      <PageHeader
        icon={ChefHat}
        title={t.title}
        description={t.subtitle}
        actions={<RecipeFormDialog />}
      />

      <form action="/recetas" method="get" className="flex items-center gap-2">
        {view !== "all" ? (
          <input type="hidden" name="vista" value={view} />
        ) : null}
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.searchPlaceholder}
            className="pl-9"
            aria-label={t.searchPlaceholder}
          />
        </div>
        <Button type="submit" variant="outline">
          {messages.foods.searchButton}
        </Button>
      </form>

      <nav aria-label={t.title} className="flex flex-wrap gap-1.5">
        {VIEWS.map((candidate) => (
          <Link
            key={candidate}
            href={buildHref({ q: query, vista: candidate })}
            aria-current={view === candidate ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              view === candidate
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {VIEW_LABELS[candidate]}
          </Link>
        ))}
      </nav>

      {recipes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recetas/${recipe.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <FoodThumbnail
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="aspect-video w-full rounded-none"
                />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span>{recipe.name}</span>
                    {recipe.isPublic && !recipe.isOwn ? (
                      <Badge variant="outline" className="font-normal">
                        {t.publicBadge}
                      </Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium">
                    <MacroChip type="calories" value={recipe.perServing.calories} />
                    <MacroChip type="protein" value={recipe.perServing.proteinG} />
                    <span className="text-muted-foreground font-normal">
                      {t.perServing}
                    </span>
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    {recipe.preparationMinutes ? (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {recipe.preparationMinutes} min
                      </span>
                    ) : null}
                    {recipe.difficulty ? (
                      <span>
                        {
                          t.difficulties[
                            recipe.difficulty as keyof typeof t.difficulties
                          ]
                        }
                      </span>
                    ) : null}
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.noRecipes}
          description={t.noRecipesDescription}
          icon={ChefHat}
        />
      )}
    </>
  );
}
