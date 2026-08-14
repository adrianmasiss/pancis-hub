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
      {/* "Atras" es un descarte, no una accion real: se queda callado. */}
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          {messages.common.back}
        </Button>
      ) : (
        <span />
      )}
      {/* Avanzar es LA accion de cada paso, y no hay otra que compita. */}
      <Button type="submit" variant="brand" size="lg" disabled={pending}>
        {pending ? messages.common.loading : submitLabel}
      </Button>
    </div>
  );
}
