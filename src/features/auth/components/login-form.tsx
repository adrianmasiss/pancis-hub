"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";
import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { Button } from "@/components/ui/button";
import { PasskeyLogin } from "@/features/auth/components/passkey-login";
import { RememberToggle } from "@/features/auth/components/remember-toggle";
import { IconField } from "@/features/auth/components/icon-field";
import { PasswordField } from "@/features/auth/components/password-field";
import { signIn } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") ? messages.auth.errors.sessionExpired : null,
  );
  const [rememberMe, setRememberMe] = useState(true);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    if (passkeyBusy) return;
    setServerError(null);
    startTransition(async () => {
      const result = await signIn(data, searchParams.get("next") ?? undefined);
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="auth-reference-form flex flex-col items-center gap-6">
      {/*
        Solo el titulo. La marca y la frase de bienvenida viven en la zona
        negra del escenario, quietas mientras la hoja sube; repetirlas aqui
        daba dos logotipos y la misma frase dos veces. `AuthFormHeader` se
        conserva intacto porque Recuperar y Nueva contrasena siguen siendo
        tarjetas de una columna y ahi la marca SI hace falta.
      */}
      <div
        className="auth-step w-full"
        style={{ "--step": 0 } as React.CSSProperties}
      >
        <h1 className="page-display text-balance">
          {messages.auth.login.title}
        </h1>
      </div>

      {/* El cuerpo del formulario llega un paso detras del titulo. */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        style={{ "--step": 1 } as React.CSSProperties}
        className="auth-step flex w-full flex-col gap-4"
        noValidate
      >
        {/* Un solo campo para las dos formas de entrar. `type="text"`, no
            `email`: con `email` el navegador marca como invalido un usuario
            —que no lleva arroba— y ofrece solo correos guardados.
            `autoComplete="username"` es justo el valor para esto; el gestor de
            contraseñas guarda ahi lo que se use, sea correo o usuario. */}
        <IconField
          icon={UserRound}
          label={messages.auth.fields.identifier}
          type="text"
          autoComplete="username"
          placeholder={messages.auth.fields.identifierPlaceholder}
          error={form.formState.errors.identifier?.message}
          {...form.register("identifier")}
        />

        <PasswordField
          label={messages.auth.fields.password}
          autoComplete="current-password"
          placeholder={messages.auth.fields.passwordPlaceholder}
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <RememberToggle
            checked={rememberMe}
            onCheckedChange={setRememberMe}
            label={messages.auth.login.rememberMe}
          />
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

        {/*
          El boton se ENCOGE a un disco con spinner mientras envia, en vez de
          cambiar su rotulo por "Cargando...". Es el gesto de las dos
          referencias, y dice algo que el cambio de texto no dice: que el
          boton dejo de estar disponible. Un boton del mismo tamano con otra
          palabra sigue invitando a pulsarlo.

          El ancho y el radio se animan juntos con la curva de la fuente. El
          nombre accesible lo lleva `aria-label`, asi que un lector de
          pantalla oye "Enviando" y no un boton sin texto.
        */}
        <Button
          type="submit"
          variant="brand"
          size="xl"
          disabled={pending || passkeyBusy}
          aria-busy={pending}
          aria-label={pending ? messages.common.loading : undefined}
          className={cn(
            "relative overflow-hidden transition-[width,border-radius]",
            "duration-[var(--pc-dur-surface,260ms)] ease-[var(--pc-spring)]",
            pending ? "mx-auto w-14 rounded-full" : "w-full",
          )}
        >
          <span
            aria-hidden={pending}
            className={cn(
              "transition-opacity duration-[var(--pc-dur-hover,160ms)] ease-linear",
              pending && "opacity-0",
            )}
          >
            {messages.auth.login.submit}
          </span>
          {pending ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center"
            >
              <NewtonsCradle size={32} />
            </span>
          ) : null}
        </Button>
      </form>

      <PasskeyLogin
        next={searchParams.get("next")}
        disabled={pending}
        onBusyChange={setPasskeyBusy}
      />

      <p
        style={{ "--step": 2 } as React.CSSProperties}
        className="auth-step auth-account-link flex flex-wrap items-center justify-center gap-2 text-sm"
      >
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
