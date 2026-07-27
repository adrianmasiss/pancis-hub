"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/features/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { messages } from "@/i18n/es-419";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") ? messages.auth.errors.sessionExpired : null,
  );
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
    <Card className="shadow-[0_28px_80px_-54px_color-mix(in_oklch,var(--foreground)_70%,transparent)]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold [letter-spacing:0]">
          {messages.auth.login.title}
        </CardTitle>
        <CardDescription className="text-sm leading-6">
          {messages.auth.login.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
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
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
          {serverError ? (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full font-semibold" disabled={pending}>
            {pending ? messages.common.loading : messages.auth.login.submit}
          </Button>
        </form>
        <div className="text-muted-foreground mt-4 space-y-2 text-center text-sm">
          <p>
            <Link href="/recuperar" className="hover:text-foreground underline">
              {messages.auth.login.forgotPassword}
            </Link>
          </p>
          <p>
            {messages.auth.login.noAccount}{" "}
            <Link href="/registro" className="hover:text-foreground underline">
              {messages.auth.login.registerLink}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
