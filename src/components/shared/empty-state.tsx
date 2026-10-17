import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Un vacio siempre dice tres cosas, en este orden: que va aqui, por que
 * todavia no esta, y cual es el siguiente paso. Un titulo solo ("Sin
 * registros") deja a la persona decidiendo que hacer, que es justo lo que
 * hay que evitar.
 *
 * `suggestions` cubre el caso distinto: cuando la persona SI dijo que
 * buscaba y no hubo resultado. Cero resultados no es cero intencion, asi
 * que devolvemos lo mas cercano que si existe antes de que se vaya.
 *
 * `tone` decide el registro del texto, no el color. "warm" es para la
 * bandeja sin estrenar, donde una frase con calidez cae bien. "plain" es
 * para la ausencia de un dato de salud, donde no la tiene.
 */
type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  /** Salida alternativa, al lado de la principal y con menos peso. */
  secondaryAction?: React.ReactNode;
  /** Lo mas cercano que si tenemos. Para busquedas y filtros sin resultado. */
  suggestions?: { label: string; href: string }[];
  suggestionsLabel?: string;
  /**
   * "inline" vive dentro de una tarjeta que ya tiene su encabezado.
   * "page" es la superficie entera y se centra: no compite con nada.
   */
  size?: "inline" | "page";
  tone?: "warm" | "plain";
  /**
   * Un vacio en linea pinta su propia superficie cuando vive suelto en la
   * pagina. Dentro de una tarjeta que ya tiene fondo hay que apagarla: dos
   * superficies anidadas no crean jerarquia, solo un marco de mas.
   */
  surface?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  suggestions,
  suggestionsLabel,
  size = "inline",
  tone = "plain",
  surface = true,
  className,
}: EmptyStateProps) {
  const page = size === "page";
  return (
    <div
      data-tone={tone}
      className={cn(
        "flex flex-col gap-3",
        page
          ? // Filete discontinuo: en este sistema el trazo cortado dice "aun
            // no hay nada" y el continuo dice "esto se rompio" (ver ErrorState).
            "border-hairline items-center justify-center rounded-3xl border border-dashed px-6 py-14 text-center sm:px-10 sm:py-20"
          : [
              "items-start justify-center rounded-2xl text-left",
              surface
                ? "bg-card-raised/55 px-6 py-10 sm:min-h-48 sm:px-8 sm:py-12"
                : "py-8",
            ],
        className,
      )}
    >
      {Icon ? (
        page ? (
          // El disco le da peso optico al glifo para que sostenga una
          // superficie entera. Es un tinte plano, no un resplandor.
          <span
            className="bg-primary/10 ring-primary/15 text-primary mb-1 grid size-14 place-items-center rounded-2xl ring-1"
            aria-hidden="true"
          >
            <Icon className="size-6" strokeWidth={1.5} />
          </span>
        ) : (
          <Icon
            className="text-primary size-6"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        )
      ) : null}

      <h2
        className={cn(
          "font-semibold tracking-[-0.02em]",
          page ? "text-xl" : "text-base",
        )}
      >
        {title}
      </h2>

      {description ? (
        <p
          className={cn(
            "text-muted-foreground max-w-[46ch] leading-relaxed",
            page ? "text-sm text-balance" : "text-[0.8125rem] text-pretty",
          )}
        >
          {description}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div
          data-empty-actions=""
          className={cn(
            "flex flex-wrap items-center gap-3 pt-2",
            page && "justify-center",
          )}
        >
          {action}
          {secondaryAction}
        </div>
      ) : null}

      {suggestions?.length ? (
        <div
          className={cn(
            "mt-3 flex w-full flex-col gap-2",
            page ? "max-w-[34ch] items-start text-left" : "items-start",
          )}
        >
          {suggestionsLabel ? (
            <p className="text-muted-foreground font-mono text-[0.625rem] font-medium tracking-[0.11em] uppercase">
              {suggestionsLabel}
            </p>
          ) : null}
          <ul className="flex w-full flex-col">
            {suggestions.map((suggestion) => (
              <li key={suggestion.href}>
                <Link
                  href={suggestion.href}
                  className="text-primary hover:bg-primary/8 -mx-2 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm transition-colors"
                >
                  <ArrowUpRight
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {suggestion.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
