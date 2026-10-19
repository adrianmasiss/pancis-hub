"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Mail, User } from "lucide-react";
import { ActionButton } from "@/components/ui/action";
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
      username: "",
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
    <div className="auth-reference-form flex flex-col items-center gap-6">
      <div
        className="auth-step w-full"
        style={{ "--step": 0 } as React.CSSProperties}
      >
        <h1 className="page-display text-balance">
          {messages.auth.register.title}
        </h1>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="auth-step flex w-full flex-col gap-4"
        style={{ "--step": 1 } as React.CSSProperties}
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

        {/* El usuario va DESPUES del nombre y antes del correo: primero como
            te llamas, luego como te llamamos, luego donde te escribimos. La
            arroba es suya —es el simbolo de un nombre de usuario— y el correo
            se queda con el sobre. */}
        <IconField
          icon={AtSign}
          label={messages.auth.fields.username}
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          placeholder={messages.auth.fields.usernamePlaceholder}
          error={form.formState.errors.username?.message}
          hint={messages.auth.fields.usernameHint}
          {...form.register("username")}
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

        <ActionButton
          family="add"
          loading={pending}
          className="w-full"
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {messages.auth.register.submit}
        </ActionButton>
      </form>

      {/* Mismo orden que Iniciar sesion: pie, divisor y terceros al final. */}
      <p
        className="auth-step auth-account-link flex flex-wrap items-center justify-center gap-2 text-sm"
        style={{ "--step": 2 } as React.CSSProperties}
      >
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

      <div
        className="auth-step flex w-full flex-col items-center gap-4"
        style={{ "--step": 3 } as React.CSSProperties}
      >
        <SocialAuthRow />
      </div>
    </div>
  );
}
