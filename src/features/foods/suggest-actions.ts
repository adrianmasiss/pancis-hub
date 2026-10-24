"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FoodSuggestion = { id: string; name: string; brand: string | null };

/**
 * Sugerencias del buscador de la Biblioteca.
 *
 * Tres consultas a la vez: lo propio que contiene lo escrito, los nombres
 * que EMPIEZAN con lo escrito y los que lo CONTIENEN. Con una sola (`%term%` ordenada por nombre y con tope) los
 * buenos resultados podian quedar fuera del tope, detras de nombres que
 * empiezan con comillas o digitos. El orden final lo pone el cliente.
 */
export async function suggestFoods(input: {
  term: string;
}): Promise<FoodSuggestion[]> {
  const parsed = z
    .object({ term: z.string().trim().min(2).max(60) })
    .safeParse(input);
  if (!parsed.success) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // `%` y `_` del usuario son literales, no comodines.
  const term = parsed.data.term.replace(/[%_\\]/g, (c) => `\\${c}`);
  const base = () =>
    supabase
      .from("foods")
      .select("id, name, brand")
      .is("deleted_at", null)
      .is("data_issue", null)
      .order("name")
      .limit(12);
  // La tercera mira solo el catalogo propio (base y alimentos del usuario,
  // los que no vienen de un proveedor): son pocos y son los que la persona
  // usa. Sin ella, «pollo» se llenaba de «POLLOCK» importados y la
  // «Pechuga de pollo» del plan no aparecia.
  const [own, prefix, contains] = await Promise.all([
    base().is("external_source", null).ilike("name", `%${term}%`),
    base().ilike("name", `${term}%`),
    base().ilike("name", `%${term}%`),
  ]);
  const seen = new Set<string>();
  const out: FoodSuggestion[] = [];
  for (const row of [
    ...(own.data ?? []),
    ...(prefix.data ?? []),
    ...(contains.data ?? []),
  ]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push({ id: row.id, name: row.name, brand: row.brand });
  }
  return out;
}
