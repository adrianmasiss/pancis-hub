"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toOptionalNumber } from "@/lib/forms";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { StepNavigation } from "@/features/onboarding/components/step-navigation";
import {
  activitySchema,
  type ActivityInput,
} from "@/features/onboarding/schemas";
import { messages } from "@/i18n/es-419";

const f = messages.onboarding.fields;

type ActivityStepProps = {
  defaultValues: Partial<ActivityInput>;
  onNext: (data: ActivityInput) => void;
  onBack: () => void;
};

export function ActivityStep({
  defaultValues,
  onNext,
  onBack,
}: ActivityStepProps) {
  const form = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      experienceLevel: defaultValues.experienceLevel,
      trainingDaysPerWeek: defaultValues.trainingDaysPerWeek,
      trainingType: defaultValues.trainingType ?? "",
      activityLevel: defaultValues.activityLevel,
      dailySteps: defaultValues.dailySteps,
    },
  });
  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-4" noValidate>
      <SelectField
        label={f.experienceLevel}
        placeholder="—"
        options={[
          { value: "principiante", label: f.beginner },
          { value: "intermedio", label: f.intermediate },
          { value: "avanzado", label: f.advanced },
        ]}
        error={errors.experienceLevel?.message}
        {...form.register("experienceLevel")}
      />
      <FormField
        label={f.trainingDays}
        type="number"
        inputMode="numeric"
        min={0}
        max={7}
        error={errors.trainingDaysPerWeek?.message}
        {...form.register("trainingDaysPerWeek", {
          setValueAs: toOptionalNumber,
        })}
      />
      <FormField
        label={`${f.trainingType} (${messages.common.optional.toLowerCase()})`}
        error={errors.trainingType?.message}
        {...form.register("trainingType")}
      />
      <SelectField
        label={f.activityLevel}
        placeholder="—"
        options={[
          { value: "sedentario", label: f.sedentary },
          { value: "ligero", label: f.light },
          { value: "moderado", label: f.moderate },
          { value: "alto", label: f.high },
        ]}
        error={errors.activityLevel?.message}
        {...form.register("activityLevel")}
      />
      <FormField
        label={`${f.dailySteps} (${messages.common.optional.toLowerCase()})`}
        type="number"
        inputMode="numeric"
        min={0}
        error={errors.dailySteps?.message}
        {...form.register("dailySteps", { setValueAs: toOptionalNumber })}
      />
      <StepNavigation onBack={onBack} />
    </form>
  );
}
