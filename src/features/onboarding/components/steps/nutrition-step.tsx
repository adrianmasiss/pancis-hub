"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toOptionalNumber } from "@/lib/forms";
import { FormField } from "@/components/shared/form-field";
import { StepNavigation } from "@/features/onboarding/components/step-navigation";
import {
  nutritionPreferencesSchema,
  type NutritionPreferencesInput,
} from "@/features/onboarding/schemas";
import { messages } from "@/i18n/es-419";

const f = messages.onboarding.fields;
const optional = ` (${messages.common.optional.toLowerCase()})`;

type NutritionStepProps = {
  defaultValues: Partial<NutritionPreferencesInput>;
  onNext: (data: NutritionPreferencesInput) => void;
  onBack: () => void;
};

export function NutritionStep({
  defaultValues,
  onNext,
  onBack,
}: NutritionStepProps) {
  const form = useForm<NutritionPreferencesInput>({
    resolver: zodResolver(nutritionPreferencesSchema),
    defaultValues: {
      allergies: defaultValues.allergies ?? "",
      restrictions: defaultValues.restrictions ?? "",
      dislikedFoods: defaultValues.dislikedFoods ?? "",
      mealsPerDay: defaultValues.mealsPerDay ?? 3,
      usualTrainingTime: defaultValues.usualTrainingTime ?? "",
    },
  });
  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-4" noValidate>
      <FormField
        label={`${f.allergies}${optional}`}
        help={f.preferencesHelp}
        error={errors.allergies?.message}
        {...form.register("allergies")}
      />
      <FormField
        label={`${f.restrictions}${optional}`}
        help={f.preferencesHelp}
        error={errors.restrictions?.message}
        {...form.register("restrictions")}
      />
      <FormField
        label={`${f.dislikedFoods}${optional}`}
        help={f.preferencesHelp}
        error={errors.dislikedFoods?.message}
        {...form.register("dislikedFoods")}
      />
      <FormField
        label={f.mealsPerDay}
        type="number"
        inputMode="numeric"
        min={1}
        max={10}
        error={errors.mealsPerDay?.message}
        {...form.register("mealsPerDay", { setValueAs: toOptionalNumber })}
      />
      <FormField
        label={`${f.usualTrainingTime}${optional}`}
        type="time"
        error={errors.usualTrainingTime?.message}
        {...form.register("usualTrainingTime")}
      />
      <StepNavigation onBack={onBack} />
    </form>
  );
}
