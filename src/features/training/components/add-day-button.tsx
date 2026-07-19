"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addPlanDay } from "@/features/training/actions";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export function AddDayButton({ planId }: { planId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await addPlanDay({ planId });
          if ("error" in result) toast.error(result.error);
          else toast.success(t.dayAdded);
        })
      }
    >
      <Plus className="size-4" aria-hidden="true" />
      {t.addDay}
    </Button>
  );
}
