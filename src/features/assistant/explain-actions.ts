"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getFormulaExplanation,
  getSourcesForFormula,
} from "@/server/tools/evidence";
import { messages } from "@/i18n/es-419";
import type { ToolSource } from "@/server/tools/types";

/**
 * "De donde sale este numero", fuera del chat.
 *
 * La trazabilidad que costo toda la fase 2 solo se veia si el usuario abria el
 * asistente Y ademas acertaba con las palabras. Esto la pone al lado de la
 * cifra, que es donde la pregunta aparece de verdad.
 *
 * No hay modelo por medio: el texto ya esta redactado y revisado en
 * formula_versions. Cuesta una consulta, no una llamada de IA.
 */

export type NumberExplanation = {
  key: string;
  label: string;
  value: string;
  rationale: string;
  limitations: string | null;
  isProductParameter: boolean;
  sources: {
    title: string;
    identifier: string | null;
    evidenceGrade: ToolSource["evidenceGrade"];
    population: string | null;
    role: string | null;
    note: string | null;
  }[];
};

export async function explainNumbers(
  keys: string[],
): Promise<{ error: string } | { explanations: NumberExplanation[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.assistant.actionFailed };

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal")
    .eq("id", user.id)
    .maybeSingle();

  const resolved = await Promise.all(
    keys.map(async (key) => {
      const [explanation, grounded] = await Promise.all([
        // El objetivo recorta las tablas por objetivo a la fila que le toca.
        getFormulaExplanation(key, profile?.primary_goal ?? null),
        getSourcesForFormula(key),
      ]);
      if (!explanation) return null;

      return {
        key,
        ...explanation,
        sources: grounded.sources.map((source: ToolSource) => ({
          title: source.title,
          identifier: source.identifier,
          evidenceGrade: source.evidenceGrade,
          population: source.population,
          role: source.role,
          note: source.note,
        })),
      };
    }),
  );

  return {
    explanations: resolved.filter(
      (entry): entry is NumberExplanation => entry !== null,
    ),
  };
}
