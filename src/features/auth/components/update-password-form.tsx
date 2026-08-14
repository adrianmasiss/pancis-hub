"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { updatePassword } from "@/features/auth/actions";
import { FormField } from "@/components/shared/form-field";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/features/auth/schemas";
import { messages } from "@/i18n/es-419";

export function UpdatePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", passwordConfirm: "" },
  });

  const onSubmit = (data: UpdatePasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePassword(data);
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  };

  return (
    <Section
      title={messages.auth.updatePassword.title}
      description={messages.auth.updatePassword.description}
    >
      <div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label={messages.auth.fields.password}
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
          <FormField
            label={messages.auth.fields.passwordConfirm}
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.passwordConfirm?.message}
            {...form.register("passwordConfirm")}
          />
          {serverError ? (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending
              ? messages.common.loading
              : messages.auth.updatePassword.submit}
          </Button>
        </form>
      </div>
    </Section>
  );
}
