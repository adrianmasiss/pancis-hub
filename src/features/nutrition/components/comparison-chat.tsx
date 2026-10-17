"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { askAssistant } from "@/features/assistant/actions";
import { AssistantReplyCard } from "@/features/assistant/components/assistant-reply-card";
import type { AssistantReply } from "@/features/assistant/types";
import {
  FocusCard,
  FocusCardContent,
  FocusCardHeader,
  FocusCardTitle,
  FocusCardTrigger,
} from "@/components/ui/focus-card";
import type { ComparisonFood } from "./swap-comparison-board";
import { formatMacro } from "./macro-comparison";

function describe(food: ComparisonFood) {
  const m = food.macros;
  return `${food.name.slice(0, 60)} (${formatMacro(food.quantityG)}g${m ? `; ${formatMacro(m.calories)}kcal; P ${formatMacro(m.proteinG)}, C ${formatMacro(m.carbohydrateG)}, G ${formatMacro(m.fatG)}, fibra ${formatMacro(m.fiberG)}g` : ""})`;
}

/** Each question captures both visible portions; a new comparison starts a fresh thread. */
export function ComparisonChat({
  source,
  alternative,
}: {
  source: ComparisonFood;
  alternative: ComparisonFood | null;
}) {
  const [question, setQuestion] = useState("");
  const [turn, setTurn] = useState<{
    question: string;
    reply: AssistantReply;
  } | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const context = `Comparo A: ${describe(source)}${alternative ? ` con B: ${describe(alternative)}` : ""}. Consulta: `;
  const limit = Math.max(1, 500 - context.length);
  return (
    <details className="comparison-assistance">
      <summary>Consultar esta comparación con el asistente</summary>
      <section
        className="comparison-chat comparison-copilot"
        aria-label="Consulta sobre la comparación"
      >
        {turn && (
          <div className="comparison-chat-reply" aria-live="polite">
            <p>{turn.reply.observation}</p>
            <FocusCard>
              <FocusCardTrigger asChild>
                <button type="button" className="compact-text-button">
                  Ver respuesta
                </button>
              </FocusCardTrigger>
              <FocusCardContent>
                <FocusCardHeader>
                  <FocusCardTitle>{turn.question}</FocusCardTitle>
                </FocusCardHeader>
                <div className="p-4">
                  <AssistantReplyCard reply={turn.reply} />
                </div>
              </FocusCardContent>
            </FocusCard>
          </div>
        )}
        <form
          className="assistant-composer pc-live-edge"
          onSubmit={(event) => {
            event.preventDefault();
            const text = question.trim().slice(0, limit);
            if (!text || pending) return;
            setError("");
            startTransition(async () => {
              try {
                const result = await askAssistant({
                  message: context + text,
                  conversationId: conversationId ?? undefined,
                });
                if ("error" in result) {
                  setError(result.error);
                  return;
                }
                setConversationId(result.conversationId);
                setTurn({ question: text, reply: result.reply });
                setQuestion("");
              } catch {
                setError("No pudimos enviar la consulta. Inténtalo de nuevo.");
              }
            });
          }}
        >
          <div className="assistant-input-row">
            <textarea
              rows={1}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              aria-label="Pregunta sobre los alimentos comparados"
              placeholder="¿Qué cambia si elijo esta alternativa?"
              value={question}
              maxLength={limit}
              disabled={pending}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>
          <div className="assistant-context">
            <span>
              <Sparkles className="size-3" aria-hidden="true" />
              Alimentos comparados
            </span>
            <button
              data-glow
              className="assistant-send"
              type="submit"
              aria-label={pending ? "Consultando" : "Enviar consulta"}
              disabled={pending || !question.trim()}
            >
              <ArrowUpRight className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        </form>
        {pending && (
          <p role="status" className="compact-note">
            Consultando…
          </p>
        )}
        {error && (
          <p role="alert" className="compact-note">
            {error}
          </p>
        )}
      </section>
    </details>
  );
}
