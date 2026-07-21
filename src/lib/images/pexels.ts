const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

export function hasPexelsApiKey(): boolean {
  return Boolean(process.env.PEXELS_API_KEY?.trim());
}

export type PexelsPhoto = {
  url: string;
  photographer: string;
};

type PexelsSearchResponse = {
  photos?: { src?: { medium?: string }; photographer?: string }[];
};

/** Busca la primera foto para `query`. Retorna null si no hay match o falla. */
export async function searchPexelsPhoto(
  query: string,
): Promise<PexelsPhoto | null> {
  if (!hasPexelsApiKey()) return null;

  try {
    const url = `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=square`;
    const response = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY!.trim() },
    });
    if (!response.ok) {
      console.error("[Pexels] busqueda fallida", query, response.status);
      return null;
    }

    const data = (await response.json()) as PexelsSearchResponse;
    const photo = data.photos?.[0];
    const mediumUrl = photo?.src?.medium;
    if (!mediumUrl) return null;

    return { url: mediumUrl, photographer: photo?.photographer ?? "Pexels" };
  } catch (error) {
    console.error("[Pexels] error de red", query, error);
    return null;
  }
}
