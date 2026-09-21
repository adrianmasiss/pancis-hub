"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthVariantToggle } from "@/features/auth/components/auth-variant-toggle";
import { AuthFormHeader } from "@/features/auth/components/auth-form-header";
import { SocialAuthRow } from "@/features/auth/components/social-auth-row";
import { IconField } from "@/features/auth/components/icon-field";
import { PasswordField } from "@/features/auth/components/password-field";
import { signIn } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { messages } from "@/i18n/es-419";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") ? messages.auth.errors.sessionExpired : null,
  );
  const [rememberMe, setRememberMe] = useState(true);
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signIn(data, searchParams.get("next") ?? undefined);
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <AuthFormHeader
        title={messages.auth.login.title}
        description={messages.auth.login.description}
      />

      <AuthVariantToggle variant="login" className="w-full lg:hidden" />

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
        {/* Pestana Correo/Telefono del prototipo: solo correo tiene backend
            hoy (signInWithPassword). Telefono queda visible pero inerte, en
            vez de omitirse, para no perder fidelidad con el diseno. */}
        <div className="border-border bg-card-raised/50 relative grid h-12 grid-cols-2 rounded-[14px] border p-[3px]">
          <span
            aria-hidden="true"
            className="bg-card border-border/60 absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-[11px] border"
          />
          <span
            role="tab"
            aria-selected="true"
            className="text-foreground relative z-10 flex items-center justify-center text-[14px] font-medium"
          >
            {messages.auth.common.emailMethod}
          </span>
          <button
            type="button"
            disabled
            title={`${messages.auth.common.phoneMethod} (${messages.auth.common.comingSoon.toLowerCase()})`}
            className="text-subtle-foreground relative z-10 flex cursor-not-allowed items-center justify-center text-[14px] font-medium"
          >
            {messages.auth.common.phoneMethod}
          </button>
        </div>

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
          autoComplete="current-password"
          placeholder={messages.auth.fields.passwordPlaceholder}
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm font-medium transition-colors">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            {messages.auth.login.rememberMe}
          </label>
          <Link
            href="/recuperar"
            className="hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
          >
            {messages.auth.login.forgotPassword}
          </Link>
        </div>

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
          {pending ? messages.common.loading : messages.auth.login.submit}
        </Button>
      </form>

      <p className="flex items-center gap-2 text-sm lg:hidden">
        <span className="text-muted-foreground">
          {messages.auth.login.noAccount}
        </span>
        <Link
          href="/registro"
          transitionTypes={["auth-swap"]}
          className="text-foreground hover:text-primary font-semibold transition-colors"
        >
          {messages.auth.login.registerLink}
        </Link>
      </p>
    </div>
  );
}
