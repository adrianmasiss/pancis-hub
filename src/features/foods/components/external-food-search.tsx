"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import {
  importExternalFood,
  searchExternalFoodsAction,
} from "@/features/foods/external-actions";
import type { ExternalSearchResult } from "@/features/foods/external-queries";
import { messages } from "@/i18n/es-419";

const t = messages.foods;
const e = messages.foods.external;
const n = messages.nutrition;

const MIN_QUERY_LENGTH = 3;

const SOURCE_LABELS = {
  usda: "USDA",
  openfoodfacts: "Open Food Facts",
} as const;

export function ExternalFoodSearch({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<ExternalSearchResult[] | null>(null);
  const [searching, startSearch] = useTransition();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importing, startImport] = useTransition();

  const search = () => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      toast.error(e.minQuery);
      return;
    }
    startSearch(async () => {
      setResults(await searchExternalFoodsAction(trimmed));
    });
  };

  const importFood = (food: ExternalSearchResult) => {
    setImportingId(food.externalId);
    startImport(async () => {
      const result = await importExternalFood({
        source: food.source,
        externalId: food.externalId,
      });
      setImportingId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.alreadyExisted ? e.alreadyInLibrary : e.imported);
      // El alimento ya vive en el catalogo local: se marca como importado
      // sin repetir la busqueda externa.
      setResults((current) =>
        (current ?? []).map((item) =>
          item.source === food.source && item.externalId === food.externalId
            ? { ...item, alreadyImported: true, importedFoodId: result.foodId }
            : item,
        ),
      );
      router.refresh();
    });
  };

  return (
    <section className="space-y-3 rounded-xl border p-3">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Globe className="size-4" aria-hidden="true" />
          {e.title}
        </h2>
        <p className="text-muted-foreground text-xs">{e.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                search();
              }
            }}
            placeholder={t.searchPlaceholder}
            className="pl-9"
            aria-label={e.title}
          />
        </div>
        <Button type="button" variant="outline" onClick={search} disabled={searching}>
          {searching ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {e.searchButton}
        </Button>
      </div>

      {searching ? (
        <p className="text-muted-foreground text-xs" role="status">
          {e.searching}
        </p>
      ) : null}

      {!searching && results !== null ? (
        results.length === 0 ? (
          <p className="text-muted-foreground text-xs">{e.noResults}</p>
        ) : (
          <>
            <p className="text-muted-foreground text-xs">{e.unverifiedNotice}</p>
            <ul className="divide-y">
              {results.map((food) => (
                <li
                  key={`${food.source}:${food.externalId}`}
                  className="flex items-center gap-2 py-2.5"
                >
                  <FoodThumbnail
                    src={food.imageUrl}
                    alt={food.name}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="truncate font-medium">{food.name}</span>
                      {food.cookedState ? (
                        <span className="text-muted-foreground">
                          ({n.cookedState[food.cookedState]})
                        </span>
                      ) : null}
                      {food.brand ? (
                        <span className="text-muted-foreground">
                          · {food.brand}
                        </span>
                      ) : null}
                      <Badge variant="outline" className="font-normal">
                        {SOURCE_LABELS[food.source]}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                      <MacroChip type="calories" value={food.per100g.calories} />
                      <MacroChip type="protein" value={food.per100g.proteinG} />
                      <MacroChip type="carbs" value={food.per100g.carbohydrateG} />
                      <MacroChip type="fat" value={food.per100g.fatG} />
                      <MacroChip type="fiber" value={food.per100g.fiberG} />
                      <span>{n.per100g}</span>
                    </p>
                  </div>
                  {food.alreadyImported ? (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {e.alreadyInLibrary}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={importing}
                      onClick={() => importFood(food)}
                      aria-label={`${e.importButton} — ${food.name}`}
                    >
                      {importing && importingId === food.externalId ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Plus className="size-4" aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline">{e.importButton}</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )
      ) : null}
    </section>
  );
}
