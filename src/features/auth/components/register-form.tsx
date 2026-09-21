"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthVariantToggle } from "@/features/auth/components/auth-variant-toggle";
import { AuthFormHeader } from "@/features/auth/components/auth-form-header";
import { SocialAuthRow } from "@/features/auth/components/social-auth-row";
import { IconField } from "@/features/auth/components/icon-field";
import { PasswordField } from "@/features/auth/components/password-field";
import { signUp } from "@/features/auth/actions";
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
    <div className="flex flex-col items-center gap-6">
      <AuthFormHeader
        title={messages.auth.register.title}
        description={messages.auth.register.description}
      />

      <AuthVariantToggle variant="register" className="w-full lg:hidden" />

      <SocialAuthRow />

      <div className="flex w-full items-center gap-3.5">
        <span className="bg-divider h-px flex-1" />
        <span className="text-muted-foreground text-sm">
          {messages.auth.common.or}
        </span>
        <span className="bg-divider h-px flex-1" />
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4"
        noValidate
      >
        <IconField
          icon={User}
          label={messages.auth.fields.displayName}
          autoComplete="name"
          placeholder={messages.auth.fields.displayName}
          error={form.formState.errors.displayName?.message}
          {...form.register("displayName")}
        />

        <IconField
          icon={Mail}
          label={messages.auth.fields.email}
          type="email"
          autoComplete="email"
          placeholder={messages.auth.fields.emailPlaceholder}
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        <PasswordField
          label={messages.auth.fields.password}
          autoComplete="new-password"
          placeholder={messages.auth.fields.passwordPlaceholder}
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

        <Button
          type="submit"
          variant="brand"
          size="xl"
          className="w-full"
          disabled={pending}
        >
          {pending ? messages.common.loading : messages.auth.register.submit}
        </Button>
      </form>

      <p className="flex items-center gap-2 text-sm lg:hidden">
        <span className="text-muted-foreground">
          {messages.auth.register.hasAccount}
        </span>
        <Link
          href="/login"
          transitionTypes={["auth-swap"]}
          className="text-foreground hover:text-primary font-semibold transition-colors"
        >
          {messages.auth.register.loginLink}
        </Link>
      </p>
    </div>
  );
}
