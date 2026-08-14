"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { requestPasswordReset } from "@/features/auth/actions";
import { FormField } from "@/components/shared/form-field";
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
    <Section
      title={messages.auth.recover.title}
      description={messages.auth.recover.description}
    >
      <div>
        {sent ? (
          <p role="status" className="text-sm">
            {messages.auth.recover.sent}
          </p>
        ) : (
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
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={pending}
            >
              {pending ? messages.common.loading : messages.auth.recover.submit}
            </Button>
          </form>
        )}
        <p className="text-muted-foreground mt-4 text-center text-sm">
          <Link href="/login" className="hover:text-foreground underline">
            {messages.auth.recover.backToLogin}
          </Link>
        </p>
      </div>
    </Section>
  );
}
