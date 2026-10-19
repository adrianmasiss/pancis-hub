"use client";

import { ActionButton } from "@/components/ui/action";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";

type StepNavigationProps = {
  onBack?: () => void;
  submitLabel?: string;
  pending?: boolean;
  confirm?: boolean;
};

export function StepNavigation({
  onBack,
  submitLabel = messages.common.continue,
  pending = false,
  confirm = false,
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
      {confirm ? (
        <ActionButton
          family="save"
          icon="confirm"
          type="submit"
          loading={pending}
        >
          {submitLabel}
        </ActionButton>
      ) : (
        <Button type="submit" variant="brand" size="lg" disabled={pending}>
          {pending ? messages.common.loading : submitLabel}
        </Button>
      )}
    </div>
  );
}
