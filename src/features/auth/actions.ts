"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";
import { pareceCorreo } from "@/features/auth/username";
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
function mapAuthError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;

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
      // Se registra en el servidor para depurar; nunca se expone el
      // detalle interno al usuario (docs/SECURITY.md).
      console.error("[Auth Error - Unhandled Code]", code, error);
      return messages.auth.errors.generic;
  }
}

/**
 * De lo que se escribio al correo con el que Supabase sabe entrar.
 *
 * Supabase autentica por correo; el usuario es nuestro, vive en `profiles`. La
 * traduccion se hace AQUI, en el servidor, con la llave de servicio, y no con
 * una funcion SQL que pueda llamar el navegador: una funcion asi seria un
 * conversor publico de usuario a correo, es decir una forma comoda de
 * cosechar correos de cuentas reales.
 *
 * Devuelve `null` cuando no hay nadie con ese usuario, y quien llama responde
 * lo MISMO que ante una contraseña equivocada. Si contestara "ese usuario no
 * existe", la pantalla diria quien esta registrado y quien no.
 */
async function correoDelIdentificador(
  identificador: string,
): Promise<string | null> {
  if (pareceCorreo(identificador)) return identificador;

  const admin = createAdminClient();
  const { data: perfil, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", identificador)
    .maybeSingle();

  if (error) {
    console.error("[Auth] Fallo al buscar el usuario", error);
    return null;
  }
  if (!perfil) return null;

  const { data, error: errorUsuario } = await admin.auth.admin.getUserById(
    perfil.id,
  );
  if (errorUsuario) {
    console.error("[Auth] Fallo al leer la cuenta del usuario", errorUsuario);
    return null;
  }
  return data.user?.email ?? null;
}

/** Si el usuario ya esta tomado. El indice unico es la garantia; esto es solo
    para poder decirlo ANTES de crear la cuenta, con un mensaje util. */
async function usuarioDisponible(usuario: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", usuario)
    .maybeSingle();

  if (error) {
    console.error("[Auth] Fallo al comprobar el usuario", error);
    // Ante la duda se deja pasar: el indice unico sigue estando detras.
    return true;
  }
  return data === null;
}

export async function signIn(
  input: LoginInput,
  next?: string,
  remember = true,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.auth.errors.invalidCredentials };
  }

  const email = await correoDelIdentificador(parsed.data.identifier);
  if (!email) {
    return { error: messages.auth.errors.invalidCredentials };
  }

  /* La marca va ANTES de crear el cliente: es él quien decide con ella si
     las cookies de auth caducan o mueren con el navegador. */
  const cookieStore = await cookies();
  if (remember) cookieStore.delete(REMEMBER_COOKIE);
  else cookieStore.set(REMEMBER_COOKIE, "1", { path: "/", sameSite: "lax" });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
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

  if (!(await usuarioDisponible(parsed.data.username))) {
    return { error: messages.auth.errors.usernameTaken };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
        username: parsed.data.username,
      },
    },
  });
  if (error) {
    /* El disparador que crea el perfil aborta el alta si el usuario se tomo
       entre la comprobacion de arriba y este insert. Supabase lo devuelve como
       fallo de base de datos, sin codigo propio, asi que se mira el texto: es
       lo unico que distingue esa carrera de un fallo de verdad. */
    if (/duplicate key|profiles_username_key/i.test(error.message)) {
      return { error: messages.auth.errors.usernameTaken };
    }
    return { error: mapAuthError(error) };
  }

  redirect("/onboarding");
}

/**
 * Cierra la sesion. Con `endpoint` (la suscripcion push de este dispositivo,
 * ya dada de baja en el navegador) borra tambien su fila: si no, el telefono
 * seguiria recibiendo los avisos de una cuenta de la que ya salio.
 */
export async function signOut(endpoint?: unknown): Promise<void> {
  const supabase = await createClient();
  if (typeof endpoint === "string" && endpoint.startsWith("https://")) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
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
