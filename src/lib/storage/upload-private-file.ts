import type { createClient } from "@/lib/supabase/server";

function fileExtension(file: File): string {
  const byName = file.name.split(".").pop()?.toLowerCase();
  if (byName && byName.length <= 5) return byName;
  return file.type.split("/").pop() ?? "bin";
}

/**
 * Sube un archivo a un bucket privado en la carpeta del usuario
 * (`<userId>/<archivo>`, la convencion que exigen las policies de RLS de
 * storage.objects). Retorna la ruta guardada o null si el archivo no pasa
 * las validaciones o falla la subida.
 */
export async function uploadPrivateFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  userId: string,
  file: File,
  allowedMime: string[],
  maxBytes: number,
): Promise<string | null> {
  if (!allowedMime.includes(file.type) || file.size > maxBytes) return null;
  const path = `${userId}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type });
  return error ? null : path;
}
