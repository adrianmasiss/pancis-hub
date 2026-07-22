"use client";

import { useState, useTransition } from "react";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CompatibilityScore } from "@/components/shared/compatibility-score";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import {
  MacroChip,
  macroLabel,
  macroUnit,
  type MacroType,
} from "@/components/shared/macro-chip";
import {
  getRecipeSwapSuggestions,
  replaceMealWithRecipe,
  type RecipeSwapSuggestions,
} from "@/features/nutrition/recipe-swap-actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.recipeSwap;

function sign(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

const DIFF_MACROS: {
  type: MacroType;
  key: keyof RecipeSwapSuggestions["matches"][number]["diff"];
}[] = [
  { type: "calories", key: "calories" },
  { type: "protein", key: "proteinG" },
  { type: "carbs", key: "carbohydrateG" },
  { type: "fat", key: "fatG" },
  { type: "fiber", key: "fiberG" },
];

/**
 * Sustituye una comida completa por una receta (requisito 5.2).
 *
 * Muestra la comparacion antes de confirmar: la misma compatibilidad 0-10
 * que se usa al intercambiar un alimento, para que un 8/10 signifique lo
 * mismo en las dos pantallas.
 */
export function RecipeSwapSheet({
  mealId,
  mealName,
  hasItems,
}: {
  mealId: string;
  mealName: string;
  hasItems: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSwapSuggestions | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const result = await getRecipeSwapSuggestions({ mealId });
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else setSuggestions(result);
  };

  const confirm = (recipeId: string, servings: number) => {
    startTransition(async () => {
      const result = await replaceMealWithRecipe({ mealId, recipeId, servings });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.replaced);
        setOpen(false);
        setSuggestions(null);
      }
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else setSuggestions(null);
      }}
    >
      {/*
        El disparador va dentro de SheetTrigger: llamar setOpen(true) por
        fuera abre la hoja sin pasar por onOpenChange, y las sugerencias
        nunca se cargarian.
      */}
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label={`${t.trigger} — ${mealName}`}
        >
          <ChefHat className="size-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto px-4 pb-6">
          {!hasItems ? (
            <p className="text-muted-foreground text-sm">{t.emptyMeal}</p>
          ) : loading ? (
            <p className="text-muted-foreground text-sm">
              {messages.common.loading}
            </p>
          ) : suggestions ? (
            <>
              <p className="text-sm">
                {t.currentMeal}:{" "}
                <span className="font-medium">{suggestions.mealName}</span>{" "}
                <MacroChip
                  type="calories"
                  value={suggestions.mealMacros.calories}
                  className="text-muted-foreground"
                />
              </p>

              {suggestions.matches.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t.noRecipes}</p>
              ) : (
                <ul className="space-y-2">
                  {suggestions.matches.map((match) => (
                    <li
                      key={match.recipe.id}
                      className="space-y-2 rounded-xl border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FoodThumbnail
                          src={match.recipe.imageUrl}
                          alt={match.recipe.name}
                          className="size-10"
                        />
                        <span className="flex-1 text-sm font-medium">
                          {match.recipe.name}
                        </span>
                      </div>

                      <p className="text-sm tabular-nums">
                        {t.suggestedServings}:{" "}
                        <span className="font-medium">
                          {match.servings} {t.servingsLabel}
                        </span>{" "}
                        <MacroChip
                          type="calories"
                          value={match.macros.calories}
                          className="text-muted-foreground"
                        />
                      </p>

                      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                        <span>{messages.swap.differences}:</span>
                        {DIFF_MACROS.map(({ type, key }) => (
                          <span key={type} className="tabular-nums">
                            {macroLabel(type)} {sign(match.diff[key])}{" "}
                            {macroUnit(type)}
                          </span>
                        ))}
                      </p>

                      <CompatibilityScore score={match.compatibility} />

                      <Button
                        size="sm"
                        className="w-full"
                        disabled={pending}
                        onClick={() => confirm(match.recipe.id, match.servings)}
                      >
                        {pending ? messages.common.loading : t.confirm}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-muted-foreground text-xs">
                {messages.swap.compatibilityNote}
              </p>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
