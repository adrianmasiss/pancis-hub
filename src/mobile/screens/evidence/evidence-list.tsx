"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import type { EvidenceArticle } from "@/features/evidence/queries";
import { TOPICS, sourceTypeLabel } from "./labels";

/** Sin acentos ni mayusculas, para buscar «nutricion» y hallar «Nutrición». */
const plano = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Biblioteca de evidencia: lo que el copiloto usa para responder. Busqueda,
 * filtros por tema (o por tipo de estudio mientras las fuentes no tengan tema)
 * y una tarjeta por articulo que abre su vista de lectura.
 */
export function EvidenceList({ articles }: { articles: EvidenceArticle[] }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<string | null>(null);

  // Con temas cargados se filtra por tema; si no, por tipo de estudio.
  const porTema = articles.some((a) => a.topic);
  const chips = useMemo(() => {
    const vistos = new Set(
      articles.map((a) => (porTema ? a.topic : a.sourceType)).filter(Boolean),
    );
    return porTema
      ? TOPICS.filter((t) => vistos.has(t.id))
      : [...vistos].map((id) => ({ id: id!, label: sourceTypeLabel(id!) }));
  }, [articles, porTema]);

  const lista = articles.filter((a) => {
    if (filtro && (porTema ? a.topic : a.sourceType) !== filtro) return false;
    if (!q.trim()) return true;
    const texto = plano(
      [a.title, a.authors, a.journal, a.summary, a.year].join(" "),
    );
    return plano(q)
      .split(/\s+/)
      .every((w) => texto.includes(w));
  });

  return (
    <div className="m-body m-stagger">
      <p className="m-sub">
        Los estudios en los que se basa el copiloto. Toca uno para leerlo.
      </p>
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar por título, autor o revista"
          aria-label="Buscar en la evidencia"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {chips.length > 1 && (
        <div className="m-ev-filters" role="group" aria-label="Filtrar">
          <button
            type="button"
            className="m-chip-toggle m-press"
            aria-pressed={filtro === null}
            onClick={() => setFiltro(null)}
          >
            Todos
          </button>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className="m-chip-toggle m-press"
              aria-pressed={filtro === c.id}
              onClick={() => setFiltro(filtro === c.id ? null : c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <p className="m-eyebrow" aria-live="polite">
        {lista.length} {lista.length === 1 ? "artículo" : "artículos"}
      </p>
      {lista.length === 0 ? (
        <div className="m-card">
          <p className="m-sheet-text">
            Nada coincide con esa búsqueda. Prueba con otra palabra.
          </p>
        </div>
      ) : (
        <ul className="m-stack" style={{ gap: 10 }}>
          {lista.map((a) => (
            <li key={a.id}>
              <Link
                href={`/evidencia?id=${a.id}`}
                className="m-card m-ev-card m-press"
                data-size="sm"
              >
                <span className="m-ev-meta">
                  <span>{sourceTypeLabel(a.sourceType)}</span>
                  {a.evidenceGrade && (
                    <span className="m-tag" data-tone="ia">
                      Nivel {a.evidenceGrade}
                    </span>
                  )}
                  {a.topic && (
                    <span className="m-tag" data-tone="neutral">
                      {TOPICS.find((t) => t.id === a.topic)?.label ?? a.topic}
                    </span>
                  )}
                </span>
                <span className="m-ev-title">{a.title}</span>
                <span className="m-ev-source">
                  {[a.authors, a.journal].filter(Boolean).join(" · ")}
                  {a.year && (
                    <>
                      {a.authors || a.journal ? " · " : ""}
                      <span className="m-num">{a.year}</span>
                    </>
                  )}
                </span>
                {a.summary ? (
                  <span className="m-ev-summary">{a.summary}</span>
                ) : (
                  <span className="m-ev-pending">
                    <BookOpen size={14} aria-hidden="true" />
                    Resumen en español pendiente
                  </span>
                )}
                <ChevronRight
                  className="m-ev-chevron"
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
