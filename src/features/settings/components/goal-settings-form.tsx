"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { SelectField } from "@/components/shared/select-field";
import { updateGoalSettings } from "@/features/settings/actions";
import {
  goalSettingsSchema,
  type GoalSettingsInput,
} from "@/features/settings/schemas";
import { messages } from "@/i18n/es-419";

const f = messages.onboarding.fields;

/**
 * Objetivo y actividad, editables despues del onboarding.
 *
 * Antes solo se podian fijar al registrarse: quien pasaba de perder grasa a
 * ganar musculo se quedaba con las calorias de su etapa anterior para
 * siempre. Guardar aqui no reescribe los objetivos; hace aparecer el aviso
 * que los propone.
 */
export function GoalSettingsForm({
  defaultValues,
}: {
  defaultValues: GoalSettingsInput;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<GoalSettingsInput>({
    resolver: zodResolver(goalSettingsSchema),
    defaultValues,
  });
  const errors = form.formState.errors;

  const onSubmit = (data: GoalSettingsInput) => {
    startTransition(async () => {
      const result = await updateGoalSettings(data);
      if ("error" in result) toast.error(result.error);
      else toast.success(messages.settings.saved);
    });
  };

  return (
    <Section
      title={messages.settings.goalsSection}
      description={messages.settings.goalsDescription}
    >
      <div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-md space-y-4"
          noValidate
        >
          <SelectField
            label={f.goal}
            options={[
              { value: "recomposicion", label: f.goalRecomposition },
              { value: "perdida_grasa", label: f.goalFatLoss },
              { value: "ganancia_muscular", label: f.goalMuscleGain },
              { value: "mantenimiento", label: f.goalMaintenance },
            ]}
            error={errors.primaryGoal?.message}
            {...form.register("primaryGoal")}
          />
          <SelectField
            label={f.activityLevel}
            options={[
              { value: "sedentario", label: f.sedentary },
              { value: "ligero", label: f.light },
              { value: "moderado", label: f.moderate },
              { value: "alto", label: f.high },
            ]}
            error={errors.activityLevel?.message}
            {...form.register("activityLevel")}
          />
          <Button type="submit" disabled={pending}>
            {pending ? messages.common.loading : messages.settings.saveGoals}
          </Button>
        </form>
      </div>
    </Section>
  );
}
