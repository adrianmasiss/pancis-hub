import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con la service role key: evade RLS. Solo para uso server-only
 * (Server Actions, scripts), nunca importar desde codigo de cliente.
 * Usado para escribir en buckets/tablas que no tienen policy de escritura
 * para `authenticated` (ej. bucket publico food-images, catalogo compartido).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
