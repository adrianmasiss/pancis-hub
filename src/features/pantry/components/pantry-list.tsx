"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import { removePantryFood } from "@/features/pantry/actions";
import type { PantryItemView } from "@/features/pantry/queries";
import { messages } from "@/i18n/es-419";

const t = messages.pantry;
const n = messages.nutrition;

export function PantryList({ items }: { items: PantryItemView[] }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
        {t.empty}
      </p>
    );
  }

  const remove = (foodId: string) => {
    setRemovingId(foodId);
    startTransition(async () => {
      const result = await removePantryFood({ foodId });
      setRemovingId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(t.removed);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        {items.length === 1
          ? t.countOne
          : t.count.replace("{count}", String(items.length))}
      </p>
      <ul className="divide-y rounded-xl border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 px-3 py-2.5">
            <FoodThumbnail
              src={item.imageUrl}
              alt={item.name}
              className="size-10"
            />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className="truncate font-medium">{item.name}</span>
                {item.brand ? (
                  <span className="text-muted-foreground text-xs">
                    · {item.brand}
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-xs">
                <MacroChip type="calories" value={item.calories} /> {n.per100g}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-muted-foreground size-8 shrink-0"
              disabled={pending}
              onClick={() => remove(item.foodId)}
              aria-label={`${t.remove} — ${item.name}`}
            >
              {pending && removingId === item.foodId ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <X className="size-4" aria-hidden="true" />
              )}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
