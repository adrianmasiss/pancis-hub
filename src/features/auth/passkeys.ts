/** WebAuthn verifies credentials in Supabase; biometric data stays on the device. */
export function supportsPasskeys(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.get === "function" &&
    typeof navigator.credentials?.create === "function"
  );
}

export function passkeyError(error: unknown): string {
  const value = error && typeof error === "object" ? error : {};
  const code = "code" in value ? value.code : undefined;
  const name = "name" in value ? value.name : undefined;
  if (
    name === "NotAllowedError" ||
    name === "AbortError" ||
    code === "ERROR_CEREMONY_ABORTED"
  ) {
    return "No se completó la verificación. Puedes intentarlo de nuevo o usar tu contraseña.";
  }
  if (code === "passkey_disabled")
    return "El acceso con llave todavía no está habilitado. Usa tu contraseña por ahora.";
  if (
    code === "webauthn_credential_exists" ||
    code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
  )
    return "Esta llave ya está registrada en tu cuenta.";
  if (code === "too_many_passkeys")
    return "Alcanzaste el límite de llaves. Elimina una que ya no uses antes de agregar otra.";
  if (code === "webauthn_challenge_expired")
    return "La verificación venció. Inténtalo de nuevo.";
  return "No pudimos completar la operación con tu llave. Inténtalo de nuevo o usa tu contraseña.";
}

/** Never let an untrusted next parameter navigate outside this origin. */
export function passkeyDestination(next: string | null): string {
  if (
    !next?.startsWith("/") ||
    next.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(next)
  )
    return "/";
  const base = "https://pancis.invalid";
  try {
    const url = new URL(next, base);
    return url.origin === base
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}
