import type { WebFoodSource, WebProvenance } from "../lib/web-food";

export function WebFoodSources({ sources }: { sources: WebFoodSource[] }) {
  return (
    <ul className="mt-2 space-y-2 text-sm">
      {sources.map((source) => (
        <li key={source.url}>
          <a
            className="text-primary underline underline-offset-4"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {source.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function WebFoodProvenance({
  provenance,
}: {
  provenance?: WebProvenance | null;
}) {
  if (!provenance) return null;
  return (
    <div className="mt-3 text-sm">
      <p>Importado de la web · sin revisión de etiqueta.</p>
      <p className="text-muted-foreground">
        Consultado el {provenance.queriedAt.slice(0, 10)}. Las cifras se
        transcribieron con IA.
      </p>
      <WebFoodSources sources={provenance.sources} />
      <details className="mt-3">
        <summary className="cursor-pointer">
          Ver datos de origen y porción
        </summary>
        <p className="mt-2 whitespace-pre-wrap">
          {provenance.reading.evidence}
        </p>
        {provenance.reading.notes.map((note, index) => (
          <p key={index}>{note}</p>
        ))}
      </details>
    </div>
  );
}
