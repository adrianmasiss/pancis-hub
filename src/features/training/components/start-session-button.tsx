"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startSession } from "@/features/training/actions";
import { messages } from "@/i18n/es-419";

const t = messages.training;

type StartSessionButtonProps = {
  planId?: string;
  planDayId?: string;
  label?: string;
  variant?: "default" | "outline";
};

export function StartSessionButton({
  planId,
  planDayId,
  label,
  variant = "default",
}: StartSessionButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await startSession({ planId, planDayId });
          if (result && "error" in result) toast.error(result.error);
        })
      }
    >
      <Play className="size-4" aria-hidden="true" />
      {label ?? t.startSession}
    </Button>
  );
}
