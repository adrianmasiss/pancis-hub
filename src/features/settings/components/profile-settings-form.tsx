"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toOptionalNumber } from "@/lib/forms";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { updateProfileSettings } from "@/features/settings/actions";
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/features/settings/schemas";
import { messages } from "@/i18n/es-419";

const f = messages.onboarding.fields;

type ProfileSettingsFormProps = {
  defaultValues: ProfileSettingsInput;
};

export function ProfileSettingsForm({
  defaultValues,
}: ProfileSettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileSettingsInput>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues,
  });
  const errors = form.formState.errors;

  const onSubmit = (data: ProfileSettingsInput) => {
    startTransition(async () => {
      const result = await updateProfileSettings(data);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(messages.settings.saved);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.settings.profileSection}</CardTitle>
        <CardDescription>
          {messages.settings.profileDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-md space-y-4"
          noValidate
        >
          <FormField
            label={f.displayName}
            autoComplete="name"
            error={errors.displayName?.message}
            {...form.register("displayName")}
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
          <Button type="submit" disabled={pending}>
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
