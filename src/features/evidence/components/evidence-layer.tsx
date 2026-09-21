import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.evidence;

/**
 * Una de las tres capas de certeza (handoff, pantalla de Evidencia).
 *
 * El orden es el argumento: de la evidencia revisada por pares —la mas solida
 * y la que menos habla de ti— a tus propios numeros, que son los mas utiles y
 * los mas inciertos.
 *
 * La incertidumbre creciente se dice EN PALABRAS, en el `caveat` de cada capa,
 * y el color solo la acompana. Al reves —un degradado de verde a ambar sin
 * texto— habria que aprenderlo, y se perderia para quien no distingue esos dos
 * tonos.
 */
export function EvidenceLayer({
  step,
  name,
  claim,
  caveat,
  count,
  children,
}: {
  /** 1, 2 o 3: cercania al usuario e incertidumbre, en ese orden. */
  step: 1 | 2 | 3;
  name: string;
  claim: string;
  caveat: string;
  count?: string;
  children: React.ReactNode;
}) {
  const tone = {
    1: "text-positive border-positive/40",
    2: "text-caution border-caution/40",
    3: "text-primary border-primary/40",
  }[step];

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn("label-micro rounded-full border px-2.5 py-1", tone)}
          >
            {t.layer(step)} · {name}
          </span>
          {count ? (
            <span className="text-subtle-foreground label-micro">{count}</span>
          ) : null}
        </div>
        <h2 className="display-title">{claim}</h2>
        <p className="text-muted-foreground max-w-[62ch] text-[15px] leading-[1.65] text-pretty">
          {caveat}
        </p>
      </header>
      {children}
    </section>
  );
}
