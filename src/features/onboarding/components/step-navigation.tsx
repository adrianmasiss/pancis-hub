"use client";

import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";

type StepNavigationProps = {
  onBack?: () => void;
  submitLabel?: string;
  pending?: boolean;
};

export function StepNavigation({
  onBack,
  submitLabel = messages.common.continue,
  pending = false,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          {messages.common.back}
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={pending}>
        {pending ? messages.common.loading : submitLabel}
      </Button>
    </div>
  );
}
