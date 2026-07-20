"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  loginSchema,
  recoverSchema,
  registerSchema,
  updatePasswordSchema,
  type LoginInput,
  type RecoverInput,
  type RegisterInput,
  type UpdatePasswordInput,
} from "@/features/auth/schemas";

export type AuthActionResult = { error: string } | { success: true };

/** Traduce errores de Supabase a mensajes seguros en espanol. */
function mapAuthError(error: any): string {
  const code = error?.code;
  
  if (!code) {
    console.error("[Auth Error - No Code]", error);
    return messages.auth.errors.generic;
  }

  switch (code) {
    case "invalid_credentials":
      return messages.auth.errors.invalidCredentials;
    case "email_exists":
    case "user_already_exists":
      return messages.auth.errors.emailInUse;
    case "weak_password":
      return messages.auth.errors.weakPassword;
    case "otp_expired":
      return messages.auth.errors.sessionExpired;
    case "email_not_confirmed":
      return "Debes confirmar tu correo antes de iniciar sesión.";
    case "over_email_send_rate_limit":
      return "Has superado el límite de correos. Intenta más tarde o revisa tu bandeja de entrada.";
    default:
      console.error("[Auth Error - Unhandled Code]", error);
      // Retorna el mensaje original si existe, para facilitar el debug, o el genérico
      return error?.message || messages.auth.errors.generic;
  }
}

export async function signIn(
  input: LoginInput,
  next?: string,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.auth.errors.invalidCredentials };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: mapAuthError(error) };
  }

  // Solo rutas internas para evitar open redirects.
  const target =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(target);
}

export async function signUp(input: RegisterInput): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? messages.auth.errors.generic,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });
  if (error) {
    return { error: mapAuthError(error) };
  }

  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  input: RecoverInput,
): Promise<AuthActionResult> {
  const parsed = recoverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.auth.errors.invalidEmail };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/actualizar-password`,
  });

  // Siempre exito: no revelamos si el correo existe.
  return { success: true };
}

export async function updatePassword(
  input: UpdatePasswordInput,
): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? messages.auth.errors.generic,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: mapAuthError(error) };
  }

  redirect("/");
}
