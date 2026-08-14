"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { signUp } from "@/features/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { messages } from "@/i18n/es-419";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = (data: RegisterInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signUp(data);
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  };

  return (
    <Section
      title={messages.auth.register.title}
      description={messages.auth.register.description}
    >
      <div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label={messages.auth.fields.displayName}
            autoComplete="name"
            error={form.formState.errors.displayName?.message}
            {...form.register("displayName")}
          />
          <FormField
            label={messages.auth.fields.email}
            type="email"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
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
            {pending ? messages.common.loading : messages.auth.register.submit}
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          {messages.auth.register.hasAccount}{" "}
          <Link href="/login" className="hover:text-foreground underline">
            {messages.auth.register.loginLink}
          </Link>
        </p>
      </div>
    </Section>
  );
}
