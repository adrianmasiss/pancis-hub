"use client";

import { useTransition } from "react";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";
import { undoDietItemDaySwap } from "@/features/nutrition/day-swap-actions";

const t = messages.nutrition.swapQuestion;

/**
 * Deshace la sustitucion del dia y devuelve el alimento original al plan.
 *
 * Se muestra solo cuando hay sustitucion vigente: una accion de deshacer
 * siempre visible sugeriria que hay algo que deshacer aunque no lo haya.
 */
export function UndoDaySwapButton({
  templateItemId,
  date,
}: {
  templateItemId: string;
  date: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={t.undo}
      title={t.undo}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await undoDietItemDaySwap({ templateItemId, date });
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(t.undone);
        })
      }
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <Undo2 className="size-3" aria-hidden="true" />
      )}
    </Button>
  );
}
