"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@/components/ui/action";
import { PasswordField } from "@/features/auth/components/password-field";
import { updatePassword } from "@/features/auth/actions";
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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <PasswordField
        label={messages.auth.fields.password}
        autoComplete="new-password"
        placeholder={messages.auth.fields.password}
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <PasswordField
        label={messages.auth.fields.passwordConfirm}
        autoComplete="new-password"
        placeholder={messages.auth.fields.passwordConfirm}
        error={form.formState.errors.passwordConfirm?.message}
        {...form.register("passwordConfirm")}
      />
      {serverError ? (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      ) : null}
      <ActionButton
        family="save"
        loading={pending}
        className="w-full"
        type="submit"
        disabled={pending}
      >
        {messages.auth.updatePassword.submit}
      </ActionButton>
    </form>
  );
}
