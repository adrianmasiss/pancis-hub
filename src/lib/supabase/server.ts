import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { authCookieOptions, REMEMBER_COOKIE } from "./remember";

export async function createClient() {
  const cookieStore = await cookies();
  const remember = cookieStore.get(REMEMBER_COOKIE)?.value !== "1";

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                authCookieOptions(options, remember),
              ),
            );
          } catch {
            // Llamado desde un Server Component: el proxy refresca la sesion.
          }
        },
      },
    },
  );
}
