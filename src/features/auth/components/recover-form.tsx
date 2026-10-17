"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconField } from "@/features/auth/components/icon-field";
import { requestPasswordReset } from "@/features/auth/actions";
import { recoverSchema, type RecoverInput } from "@/features/auth/schemas";
import { messages } from "@/i18n/es-419";

export function RecoverForm() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<RecoverInput>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: RecoverInput) => {
    startTransition(async () => {
      await requestPasswordReset(data);
      setSent(true);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {sent ? (
        /* Se confirma sin decir si el correo existe: eso convertiria la
           pantalla en un detector de cuentas registradas. */
        <p
          role="status"
          className="border-border bg-card-raised/50 rounded-[14px] border px-4 py-3.5 text-sm leading-relaxed"
        >
          {messages.auth.recover.sent}
        </p>
      ) : (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <IconField
            icon={Mail}
            label={messages.auth.fields.email}
            type="email"
            autoComplete="email"
            placeholder={messages.auth.fields.emailPlaceholder}
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <Button
            type="submit"
            variant="brand"
            size="xl"
            className="w-full"
            disabled={pending}
          >
            {pending ? messages.common.loading : messages.auth.recover.submit}
          </Button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="text-foreground hover:text-primary font-semibold transition-colors"
        >
          {messages.auth.recover.backToLogin}
        </Link>
      </p>
    </div>
  );
}
