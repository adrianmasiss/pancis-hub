import type { createClient } from "@/lib/supabase/server";

/** URL firmada de la foto de perfil (bucket privado `avatars`), o null. */
export async function resolveAvatarUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  avatarStoragePath: string | null,
): Promise<string | null> {
  if (!avatarStoragePath) return null;
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarStoragePath, 3600);
  return data?.signedUrl ?? null;
}
