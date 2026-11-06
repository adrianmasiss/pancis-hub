/**
 * El logo real de una cadena, de Wikidata: su propiedad «logo» (P154) apunta
 * al archivo oficial en Wikimedia Commons, casi siempre un SVG. Gratis y sin
 * llave. Entre los resultados del nombre se queda con el primero que tenga
 * logo y sea de comida («Subway» tambien es un metro y una pelicula).
 */

import { createHash } from "node:crypto";

const API = "https://www.wikidata.org/w/api.php";
const FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";
// Wikimedia pide identificarse; sin User-Agent puede rechazar la llamada.
const HEADERS = { "User-Agent": "PancisHub/1.0 (logos de restaurantes)" };
const COMIDA =
  /restaurant|fast[- ]?food|food|coffee|caf[eé]|pizz|bakery|chain|cadena|comida|hamburgues|pollo|chicken|sandwich|taco|sushi|ice cream|helad|donut|bar\b/i;

type Claim = {
  rank?: string;
  mainsnak?: { datavalue?: { value?: unknown } };
  qualifiers?: Record<
    string,
    { datavalue?: { value?: { time?: string } } }[] | undefined
  >;
};

type Entity = {
  claims?: Record<string, Claim[] | undefined>;
  descriptions?: Record<string, { value: string } | undefined>;
};

/**
 * De los logos de una marca, el que sirve en un cuadro chico: el vigente
 * (sin fecha de fin, P582), sin eslogan, el preferido. Los de un solo pais
 * (P1001) quedan fuera. A igual puntaje, el que dejo de usarse mas tarde
 * (McDonald's: los arcos dorados antes que el logo de 1975).
 */
function bestLogo(claims: readonly Claim[]): string | null {
  const fin = (c: Claim) =>
    c.qualifiers?.P582?.[0]?.datavalue?.value?.time ?? "+9999";
  const opciones = claims
    .filter((c) => typeof c.mainsnak?.datavalue?.value === "string")
    .filter((c) => !c.qualifiers?.P1001)
    .map((c) => {
      const file = c.mainsnak!.datavalue!.value as string;
      const score =
        (/slogan/i.test(file) ? 0 : 4) +
        (c.qualifiers?.P582 ? 0 : 2) +
        (c.rank === "preferred" ? 1 : 0);
      return { file, score, fin: fin(c) };
    })
    .sort((a, b) => b.score - a.score || b.fin.localeCompare(a.fin));
  return opciones[0]?.file ?? null;
}

/** URL estable del archivo en Commons (se le agrega `?width=` al mostrarlo). */
export const commonsFileUrl = (file: string) =>
  `${FILE_PATH}${encodeURIComponent(file.replaceAll(" ", "_"))}`;

/**
 * La miniatura PNG directa de ese archivo. `Special:FilePath` llega a ella
 * tras tres redirecciones; la ruta real sale del md5 del nombre, como la
 * arma Commons. Los SVG se rasterizan (`.svg.png`).
 */
export function commonsThumb(fileUrl: string, width = 120): string | null {
  if (!fileUrl.startsWith(FILE_PATH)) return null;
  const file = decodeURIComponent(fileUrl.slice(FILE_PATH.length));
  const md5 = createHash("md5").update(file).digest("hex");
  const name = encodeURIComponent(file);
  const ext = /\.svg$/i.test(file) ? ".png" : "";
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${name}/${width}px-${name}${ext}`;
}

export function pickLogo(
  ids: readonly string[],
  entities: Record<string, Entity>,
): string | null {
  for (const id of ids) {
    const e = entities[id];
    const file = bestLogo(e?.claims?.P154 ?? []);
    if (!file) continue;
    const desc = Object.values(e?.descriptions ?? {})
      .map((d) => d?.value ?? "")
      .join(" ");
    if (COMIDA.test(desc)) return commonsFileUrl(file);
  }
  return null;
}

/** Null si no se encuentra o Wikidata no responde a tiempo. */
export async function findRestaurantLogo(name: string): Promise<string | null> {
  try {
    const signal = AbortSignal.timeout(5000);
    const search = new URLSearchParams({
      action: "wbsearchentities",
      search: name,
      language: "es",
      uselang: "es",
      type: "item",
      limit: "7",
      format: "json",
    });
    const found = (await fetch(`${API}?${search}`, {
      headers: HEADERS,
      signal,
    }).then((r) => r.json())) as { search?: { id: string }[] };
    const ids = (found.search ?? []).map((s) => s.id);
    if (ids.length === 0) return null;

    const get = new URLSearchParams({
      action: "wbgetentities",
      ids: ids.join("|"),
      props: "claims|descriptions",
      languages: "en|es",
      format: "json",
    });
    const data = (await fetch(`${API}?${get}`, {
      headers: HEADERS,
      signal,
    }).then((r) => r.json())) as { entities?: Record<string, Entity> };
    return pickLogo(ids, data.entities ?? {});
  } catch {
    return null;
  }
}
