"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toOptionalNumber } from "@/lib/forms";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { StepNavigation } from "@/features/onboarding/components/step-navigation";
import { basicsSchema, type BasicsInput } from "@/features/onboarding/schemas";
import { messages } from "@/i18n/es-419";

const f = messages.onboarding.fields;

type BasicsStepProps = {
  defaultValues: Partial<BasicsInput>;
  onNext: (data: BasicsInput) => void;
};

export function BasicsStep({ defaultValues, onNext }: BasicsStepProps) {
  const form = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      displayName: defaultValues.displayName ?? "",
      birthDate: defaultValues.birthDate ?? "",
      biologicalSex: defaultValues.biologicalSex,
      heightCm: defaultValues.heightCm,
      unitSystem: defaultValues.unitSystem ?? "metric",
      timezone:
        defaultValues.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-4" noValidate>
      <FormField
        label={f.displayName}
        autoComplete="name"
        error={errors.displayName?.message}
        {...form.register("displayName")}
      />
      <FormField
        label={f.birthDate}
        type="date"
        error={errors.birthDate?.message}
        {...form.register("birthDate")}
      />
      <SelectField
        label={f.biologicalSex}
        help={f.biologicalSexHelp}
        placeholder="—"
        options={[
          { value: "masculino", label: f.male },
          { value: "femenino", label: f.female },
        ]}
        error={errors.biologicalSex?.message}
        {...form.register("biologicalSex")}
      />
      <FormField
        label={f.heightCm}
        type="number"
        inputMode="decimal"
        step="0.1"
        error={errors.heightCm?.message}
        {...form.register("heightCm", { setValueAs: toOptionalNumber })}
      />
      <SelectField
        label={f.unitSystem}
        options={[
          { value: "metric", label: f.metric },
          { value: "imperial", label: f.imperial },
        ]}
        error={errors.unitSystem?.message}
        {...form.register("unitSystem")}
      />
      <FormField
        label={f.timezone}
        error={errors.timezone?.message}
        {...form.register("timezone")}
      />
      <StepNavigation />
    </form>
  );
}
