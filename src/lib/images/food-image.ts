import { createAdminClient } from "@/lib/supabase/admin";
import { searchPexelsPhoto } from "@/lib/images/pexels";

const BUCKET = "food-images";

/**
 * Busca una foto en Pexels para `query`, la descarga y la sube al bucket
 * publico food-images, una sola vez (se llama solo al crear). Nunca lanza:
 * cualquier fallo se registra y retorna null, para no bloquear el guardado
 * del alimento/receta que la origino (docs/SECURITY.md).
 */
export async function fetchAndStoreFoodImage(params: {
  query: string;
  pathPrefix: "foods" | "recipes";
  id: string;
}): Promise<string | null> {
  try {
    const photo = await searchPexelsPhoto(params.query);
    if (!photo) return null;

    const imageResponse = await fetch(photo.url);
    if (!imageResponse.ok) return null;
    const buffer = await imageResponse.arrayBuffer();

    const path = `${params.pathPrefix}/${params.id}.jpg`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
    if (uploadError) {
      console.error("[food-image] error al subir", path, uploadError);
      return null;
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("[food-image] error inesperado", params, error);
    return null;
  }
}
