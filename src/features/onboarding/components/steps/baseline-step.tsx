"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toOptionalNumber } from "@/lib/forms";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { StepNavigation } from "@/features/onboarding/components/step-navigation";
import {
  baselineSchema,
  type BaselineInput,
} from "@/features/onboarding/schemas";
import { todayLocalISO } from "@/lib/dates";
import { messages } from "@/i18n/es-419";

const f = messages.onboarding.fields;
const optional = ` (${messages.common.optional.toLowerCase()})`;

type BaselineStepProps = {
  defaultValues: Partial<BaselineInput>;
  onNext: (data: BaselineInput) => void;
  onBack: () => void;
};

export function BaselineStep({
  defaultValues,
  onNext,
  onBack,
}: BaselineStepProps) {
  const form = useForm<BaselineInput>({
    resolver: zodResolver(baselineSchema),
    defaultValues: {
      weightKg: defaultValues.weightKg,
      bodyFatPercentage: defaultValues.bodyFatPercentage,
      skeletalMuscleKg: defaultValues.skeletalMuscleKg,
      waistCm: defaultValues.waistCm,
      measuredAt: defaultValues.measuredAt ?? todayLocalISO(),
      measurementSource: defaultValues.measurementSource ?? "manual",
    },
  });
  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-4" noValidate>
      <FormField
        label={f.weightKg}
        type="number"
        inputMode="decimal"
        step="0.1"
        error={errors.weightKg?.message}
        {...form.register("weightKg", { setValueAs: toOptionalNumber })}
      />
      <FormField
        label={`${f.bodyFatPercentage}${optional}`}
        type="number"
        inputMode="decimal"
        step="0.1"
        error={errors.bodyFatPercentage?.message}
        {...form.register("bodyFatPercentage", {
          setValueAs: toOptionalNumber,
        })}
      />
      <FormField
        label={`${f.skeletalMuscleKg}${optional}`}
        type="number"
        inputMode="decimal"
        step="0.1"
        error={errors.skeletalMuscleKg?.message}
        {...form.register("skeletalMuscleKg", { setValueAs: toOptionalNumber })}
      />
      <FormField
        label={`${f.waistCm}${optional}`}
        type="number"
        inputMode="decimal"
        step="0.1"
        error={errors.waistCm?.message}
        {...form.register("waistCm", { setValueAs: toOptionalNumber })}
      />
      <FormField
        label={f.measuredAt}
        type="date"
        error={errors.measuredAt?.message}
        {...form.register("measuredAt")}
      />
      <SelectField
        label={f.measurementSource}
        options={[
          { value: "manual", label: f.sourceManual },
          { value: "inbody", label: f.sourceInbody },
          { value: "bascula", label: f.sourceScale },
          { value: "otro", label: f.sourceOther },
        ]}
        error={errors.measurementSource?.message}
        {...form.register("measurementSource")}
      />
      <StepNavigation onBack={onBack} />
    </form>
  );
}
