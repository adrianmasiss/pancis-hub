"use client";

import { useTransition } from "react";
import { CopyPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { duplicateDay } from "@/features/nutrition/actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition;

function shiftDate(date: string, days: number): string {
  const ms = new Date(`${date}T00:00:00Z`).getTime() + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function DuplicateDayButton({ date }: { date: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await duplicateDay({
            fromDate: shiftDate(date, -1),
            toDate: date,
          });
          if ("error" in result) toast.error(result.error);
          else toast.success(t.dayDuplicated);
        })
      }
    >
      <CopyPlus className="size-4" aria-hidden="true" />
      {t.duplicateYesterday}
    </Button>
  );
}
