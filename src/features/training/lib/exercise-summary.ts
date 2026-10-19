/**
 * «Cómo se hace» para la ficha: el resumen guardado o, si aún no lo hay, las
 * dos o tres primeras frases de la explicación completa. Nunca un muro de
 * texto entre series.
 */
export function shortSummary(row: {
  summary?: string | null;
  instructions?: string | null;
}): string | null {
  if (row.summary?.trim()) return row.summary.trim();
  const texto = row.instructions?.trim();
  if (!texto) return null;
  const frases = texto.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [texto];
  let resumen = "";
  for (const [i, frase] of frases.entries()) {
    if (i > 0 && (resumen + frase).length > 260) break;
    resumen += frase;
    if (i === 2) break;
  }
  return resumen.trim();
}
