import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import type { EvidenceArticle } from "@/features/evidence/queries";
import { BackButton } from "@/mobile/ui/back-button";
import { TOPICS, originalUrl, sourceTypeLabel } from "./labels";

/**
 * Vista de lectura de un articulo: titulo grande, fuente, ano y tipo, el
 * bloque «En resumen» y el texto completo a 16/1,6 sin cortes. Abajo, la
 * fuente original y la pregunta al copiloto con el articulo como contexto.
 *
 * Si el articulo aun no tiene su texto cargado se dice tal cual: no se
 * rellena con un resumen inventado.
 */
export function EvidenceReader({ article: a }: { article: EvidenceArticle }) {
  const link = originalUrl(a);
  const puntos = a.keyPoints.filter((p) => p.trim());
  const parrafos = (a.body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const pregunta = `Sobre el estudio «${a.title}»${a.year ? ` (${a.year})` : ""}: `;

  return (
    <div className="m-screen" data-m-fullscreen="">
      <header className="m-step-head">
        <BackButton fallback="/evidencia" label="Volver a Evidencia" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>Evidencia</span>
      </header>

      <article className="m-reader">
        <div className="m-ev-meta">
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
        </div>
        <h1 className="m-reader-title">{a.title}</h1>
        <p className="m-reader-source">
          {a.authors && <span>{a.authors}</span>}
          {(a.journal || a.year) && (
            <span>
              {a.journal}
              {a.journal && a.year ? " · " : ""}
              {a.year && <span className="m-num">{a.year}</span>}
            </span>
          )}
          {a.identifier && <span className="m-num">{a.identifier}</span>}
        </p>

        {puntos.length > 0 || a.summary ? (
          <section className="m-reader-key" aria-labelledby="m-reader-key">
            <h2 id="m-reader-key" className="m-eyebrow">
              En resumen
            </h2>
            {a.summary && <p>{a.summary}</p>}
            {puntos.length > 0 && (
              <ul>
                {puntos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="m-reader-key" data-empty="">
            <h2 className="m-eyebrow">En resumen</h2>
            <p>
              Este artículo todavía no tiene su resumen en la app.
              {link
                ? " Mientras tanto, puedes leerlo en la fuente original."
                : ""}
            </p>
          </section>
        )}

        {parrafos.length > 0 && (
          <div className="m-reader-body">
            {parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {(a.population || a.limitations) && (
          <dl className="m-reader-facts">
            {a.population && (
              <div>
                <dt>Estudiado en</dt>
                <dd>{a.population}</dd>
              </div>
            )}
            {a.limitations && (
              <div>
                <dt>Limitaciones</dt>
                <dd>{a.limitations}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="m-stack" style={{ gap: 8 }}>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="m-btn m-press"
              data-block=""
            >
              <ExternalLink size={18} aria-hidden="true" />
              Abrir la fuente original
            </a>
          )}
          <Link
            href={`/asistente?borrador=${encodeURIComponent(pregunta)}`}
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
          >
            <Sparkles size={18} aria-hidden="true" />
            Preguntarle al copiloto sobre esto
          </Link>
        </div>
      </article>
    </div>
  );
}
