import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { authCookieOptions, REMEMBER_COOKIE } from "./remember";

type CookieToSet = {
  name: string;
  value: string;
  options: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
  };
};

function readCookies() {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie.split("; ").map((par) => {
    const corte = par.indexOf("=");
    return {
      name: decodeURIComponent(par.slice(0, corte)),
      value: decodeURIComponent(par.slice(corte + 1)),
    };
  });
}

/* El cliente del navegador fuerza 400 días al refrescar el token. Con
   «No cerrar sesión» desmarcado eso convertía la cookie de sesión en
   persistente a la primera renovación; por eso escribe él mismo. */
function writeCookies(cookies: CookieToSet[]) {
  if (typeof document === "undefined") return;
  const remember = !readCookies().some(
    (c) => c.name === REMEMBER_COOKIE && c.value === "1",
  );
  for (const { name, value, options } of cookies) {
    const o = authCookieOptions(options, remember);
    let linea = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    linea += `; Path=${o.path ?? "/"}`;
    if (o.domain) linea += `; Domain=${o.domain}`;
    if (o.maxAge !== undefined) linea += `; Max-Age=${o.maxAge}`;
    if (o.expires) linea += `; Expires=${o.expires.toUTCString()}`;
    if (o.sameSite)
      linea += `; SameSite=${o.sameSite === true ? "Strict" : o.sameSite}`;
    if (o.secure) linea += "; Secure";
    document.cookie = linea;
  }
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { experimental: { passkey: true } },
      cookies: { getAll: readCookies, setAll: writeCookies },
    },
  );
}
