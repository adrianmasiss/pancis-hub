"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import { BarcodeScanner } from "@/features/foods/components/barcode-scanner";
import { searchFoods } from "@/features/nutrition/actions";
import {
  addExternalPantryFood,
  addPantryFood,
} from "@/features/pantry/actions";
import { messages } from "@/i18n/es-419";

const t = messages.pantry;
const n = messages.nutrition;

type LibraryResult = {
  id: string;
  name: string;
  brand: string | null;
  cookedState: string | null;
  caloriesPer100g: number;
  imageUrl: string | null;
};

export function PantryAdd() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<LibraryResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTermChange = (value: string) => {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const result = await searchFoods({ term: value.trim() });
      setSearching(false);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setResults(
        result.results.map((food) => ({
          id: food.id,
          name: food.name,
          brand: food.brand,
          cookedState: food.cookedState,
          caloriesPer100g: food.caloriesPer100g,
          imageUrl: food.imageUrl,
        })),
      );
    }, 300);
  };

  const add = (foodId: string) => {
    setAddingId(foodId);
    startTransition(async () => {
      const result = await addPantryFood({ foodId });
      setAddingId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.alreadyInPantry ? t.alreadyInPantry : t.added,
      );
      router.refresh();
    });
  };

  return (
    <section className="space-y-3 rounded-xl border p-3">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">{t.addTitle}</h2>
        <p className="text-muted-foreground text-xs">{t.addDescription}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={term}
            onChange={(event) => onTermChange(event.target.value)}
            placeholder={messages.foods.searchPlaceholder}
            className="pl-9"
            aria-label={t.addTitle}
          />
        </div>
        <BarcodeScanner
          confirmLabel={t.addButton}
          successMessage={t.added}
          onConfirm={(food) =>
            addExternalPantryFood({
              source: food.source,
              externalId: food.externalId,
              displayName: food.name,
            })
          }
        />
      </div>

      {searching ? (
        <p className="text-muted-foreground text-xs" role="status">
          {messages.common.loading}
        </p>
      ) : null}

      {!searching && results !== null ? (
        results.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            {messages.foods.external.noResults}
          </p>
        ) : (
          <ul className="divide-y">
            {results.map((food) => (
              <li key={food.id} className="flex items-center gap-2 py-2.5">
                <FoodThumbnail
                  src={food.imageUrl}
                  alt={food.name}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="truncate font-medium">{food.name}</span>
                    {food.cookedState ? (
                      <span className="text-muted-foreground text-xs">
                        (
                        {
                          n.cookedState[
                            food.cookedState as keyof typeof n.cookedState
                          ]
                        }
                        )
                      </span>
                    ) : null}
                    {food.brand ? (
                      <span className="text-muted-foreground text-xs">
                        · {food.brand}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    <MacroChip type="calories" value={food.caloriesPer100g} />{" "}
                    {n.per100g}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={pending}
                  onClick={() => add(food.id)}
                  aria-label={`${t.addButton} — ${food.name}`}
                >
                  {pending && addingId === food.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{t.addButton}</span>
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
