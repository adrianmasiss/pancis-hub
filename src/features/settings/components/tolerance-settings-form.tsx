"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { toOptionalNumber } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { updateToleranceSettings } from "@/features/settings/actions";
import {
  toleranceSettingsSchema,
  type ToleranceSettingsInput,
} from "@/features/settings/schemas";
import { messages } from "@/i18n/es-419";

const t = messages.settings.tolerances;

/**
 * El margen por macro, por fin editable.
 *
 * Existia en la base desde la fase 3 y no habia forma de cambiarlo. La copia
 * insiste en que es una preferencia del usuario: es la diferencia entre "te
 * avisamos si te alejas mas de un 10 %" y afirmar un limite que no existe.
 */
export function ToleranceSettingsForm({
  defaultValues,
}: {
  defaultValues: ToleranceSettingsInput;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ToleranceSettingsInput>({
    resolver: zodResolver(toleranceSettingsSchema),
    defaultValues,
  });
  const errors = form.formState.errors;

  const onSubmit = (data: ToleranceSettingsInput) => {
    startTransition(async () => {
      const result = await updateToleranceSettings(data);
      if ("error" in result) toast.error(result.error);
      else toast.success(t.saved);
    });
  };

  const field = (name: keyof ToleranceSettingsInput, label: string) => (
    <FormField
      label={label}
      type="number"
      inputMode="numeric"
      step="1"
      min={1}
      max={50}
      error={errors[name]?.message}
      {...form.register(name, { setValueAs: toOptionalNumber })}
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-md space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {field("caloriesPct", t.calories)}
            {field("proteinPct", t.protein)}
            {field("carbsPct", t.carbs)}
            {field("fatPct", t.fat)}
          </div>
          <p className="text-muted-foreground text-xs text-balance">
            {t.fiberNote}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? messages.common.loading : t.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
