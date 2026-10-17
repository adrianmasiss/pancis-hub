"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AssistantReply } from "@/features/assistant/types";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.assistant;
const c = messages.assistant.copilot;

/**
 * Una respuesta del copiloto, con la jerarquia del handoff.
 *
 * Antes las seis secciones del contrato —observacion, interpretacion, accion,
 * alternativa, razon, reevaluar— salian como seis filas iguales de un `<dl>`.
 * Todas pesaban lo mismo, asi que ninguna mandaba y habia que leer las seis
 * para saber que hacer.
 *
 * Ahora la ACCION es el titular, el razonamiento la acompana, y el porque
 * —la razon, cuando reevaluar y las fuentes— se pliega. El handoff lo llama
 * "¿Por que?" y es donde vive lo que sostiene la cifra.
 */
export function AssistantReplyCard({ reply }: { reply: AssistantReply }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const grounded = Boolean(reply.sources && reply.sources.length > 0);

  return (
    <article className="surface-card max-w-[92%] self-start p-5">
      <header className="flex flex-wrap items-center gap-2">
        <Sparkles className="text-primary size-4" aria-hidden="true" />
        {/* La etiqueta depende de si la respuesta esta fundada: decir
            "demostrativa" debajo de fuentes de nivel A era incoherente. */}
        <Badge variant="outline" className="font-normal">
          {grounded ? t.groundedBadge : t.demoBadge}
        </Badge>
        <Badge variant="secondary" className="font-normal">
          {t.sections.confidence}: {t.confidences[reply.confidence]}
        </Badge>
      </header>

      {/* El titular: que hacer. Es lo unico que hay que leer para actuar. */}
      <p className="mt-4 text-[17px] leading-[1.35] font-semibold tracking-[-0.02em] text-pretty">
        {reply.action}
      </p>

      {reply.alternative ? (
        <p className="text-muted-foreground mt-2 text-[15px] leading-[1.6] text-pretty">
          <span className="text-subtle-foreground label-micro mr-2">
            {t.sections.alternative}
          </span>
          {reply.alternative}
        </p>
      ) : null}

      {/* El razonamiento, en prosa y no en fichas: se lee una vez. */}
      <div className="border-hairline mt-4 flex flex-col gap-2 border-t pt-4">
        <p className="text-muted-foreground text-[15px] leading-[1.65] text-pretty">
          {reply.observation}
        </p>
        <p className="text-muted-foreground text-[15px] leading-[1.65] text-pretty">
          {reply.interpretation}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => setWhyOpen((open) => !open)}
          aria-expanded={whyOpen}
          className="text-foreground hover:text-primary focus-visible:ring-ring/40 flex items-center gap-1.5 rounded-sm text-[14px] font-semibold transition-colors outline-none focus-visible:ring-2"
        >
          {whyOpen ? c.whyHide : c.why}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-[var(--dur-base)]",
              whyOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {/*
          El handoff pone aqui "aceptar" y "descartar". Este copiloto NO tiene
          herramientas de escritura —devuelve propuestas, es la regla del
          producto—, asi que no hay nada que aceptar: un boton que promete
          aplicar y no aplica seria mentir. Se enlaza donde el cambio SI se
          puede hacer, con su veredicto y su confirmacion.
        */}
        <Link
          href="/nutricion"
          className="text-muted-foreground hover:text-foreground text-[14px] font-medium"
        >
          {c.goToPlan}
        </Link>
      </div>

      {whyOpen ? (
        <div className="border-hairline mt-4 flex flex-col gap-4 border-t pt-4">
          <div>
            <p className="text-subtle-foreground label-micro">
              {t.sections.reason}
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-pretty">
              {reply.reason}
            </p>
          </div>

          <div>
            <p className="text-subtle-foreground label-micro">
              {t.sections.reevaluate}
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-pretty">
              {reply.reevaluate}
            </p>
          </div>

          {/*
            Las fuentes las resuelve el SERVIDOR desde `formula_versions`, no
            las escribe el modelo: por eso pueden citarse sin miedo a que
            invente un estudio. La poblacion se muestra porque importa saber
            sobre quien se estudio lo que se te esta diciendo, y la nota del
            revisor es lo que separa "nivel A" de lo que ese nivel A dice
            realmente sobre esta cifra.
          */}
          {reply.sources && reply.sources.length > 0 ? (
            <div>
              <p className="text-subtle-foreground label-micro">
                {t.sections.sources}
              </p>
              <ul className="divide-hairline mt-1.5 flex flex-col divide-y">
                {reply.sources.map((source) => (
                  <li key={source.title} className="flex flex-col gap-1 py-2.5">
                    <span className="text-[14px] font-medium">
                      {source.title}
                    </span>
                    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                      {source.identifier ? (
                        <span>{source.identifier}</span>
                      ) : null}
                      {source.evidenceGrade ? (
                        <span>
                          {t.evidenceGrade} {source.evidenceGrade}
                        </span>
                      ) : null}
                      {source.role ? (
                        <span
                          className={
                            source.role === "sustenta"
                              ? "text-positive"
                              : "text-caution"
                          }
                        >
                          {t.sourceRoles[source.role] ?? source.role}
                        </span>
                      ) : null}
                      {source.isProductParameter ? (
                        <span className="text-caution">
                          {t.productParameter}
                        </span>
                      ) : null}
                    </span>
                    {source.population ? (
                      <span className="text-muted-foreground text-[12px] italic">
                        {source.population}
                      </span>
                    ) : null}
                    {source.note ? (
                      <span className="text-muted-foreground text-[12px] leading-relaxed">
                        {source.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
