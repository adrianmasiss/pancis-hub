"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AssistantReplyCard } from "@/features/assistant/components/assistant-reply-card";
import { BrandLogo } from "@/components/shared/brand-logo";
import { askAssistant } from "@/features/assistant/actions";
import type { AssistantReply } from "@/features/assistant/types";
import { messages } from "@/i18n/es-419";

const t = messages.assistant;
const c = messages.assistant.copilot;

type ChatEntry =
  { role: "user"; text: string } | { role: "assistant"; reply: AssistantReply };

/**
 * `initialMessage` llega desde los accesos contextuales (una comida, un
 * alimento, un ejercicio). Se PRECARGA en el campo pero NO se envia sola:
 * mandar una consulta sin que el usuario la confirme gastaria una llamada
 * al modelo por el simple hecho de tocar un boton.
 */
export function AssistantChat({ initialMessage }: { initialMessage?: string }) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  // Se conserva entre preguntas para dar continuidad a la conversacion.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setEntries((previous) => [...previous, { role: "user", text: trimmed }]);
    setMessage("");
    startTransition(async () => {
      const result = await askAssistant({
        message: trimmed,
        // Encadena con la conversacion en curso para que el asistente no
        // vuelva a pedir datos que ya le diste.
        conversationId: conversationId ?? undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setConversationId(result.conversationId);
        setEntries((previous) => [
          ...previous,
          { role: "assistant", reply: result.reply },
        ]);
      }
    });
  };

  const empty = entries.length === 0;

  return (
    /*
      Es la UNICA pantalla que no pinta el panel grande de fondo (handoff): la
      conversacion es el sujeto, y una superficie alrededor solo la encajona.
    */
    <div className="flex min-h-[calc(100dvh-18rem)] flex-col gap-6 md:min-h-[calc(100dvh-14rem)]">
      {/*
        El prototipo pone aqui un desplegable de conversaciones pasadas. No se
        rinde: recorrerlas no esta implementado, y un rotulo "Historial · 6"
        que no abre nada promete una funcion que no existe. Queda "Nueva", que
        si hace lo que dice.
      */}
      <div className="flex items-center justify-end gap-3">
        {!empty ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEntries([]);
              setConversationId(null);
              setMessage("");
            }}
          >
            <Plus aria-hidden="true" />
            {c.newConversation}
          </Button>
        ) : null}
      </div>

      {empty ? (
        /* Estado vacio del prototipo: la marca, la pregunta y —lo importante—
           que contexto cruza de verdad. La frase enumera lo que
           `AssistantContext` trae; no promete nada que no tenga. */
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
          <BrandLogo variant="mark" height={56} />
          <h2 className="page-display max-w-[22ch] text-balance">
            {c.emptyHeadline}
          </h2>
          <p className="text-muted-foreground max-w-[58ch] text-[15px] leading-[1.65] text-pretty">
            {c.emptyContext}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {entries.map((entry, index) =>
            entry.role === "user" ? (
              <p
                key={index}
                className="bg-primary text-primary-foreground max-w-[85%] self-end rounded-[16px] rounded-br-[4px] px-4 py-2.5 text-[15px] leading-[1.5]"
              >
                {entry.text}
              </p>
            ) : (
              <AssistantReplyCard key={index} reply={entry.reply} />
            ),
          )}
          {pending ? (
            <p className="text-muted-foreground flex items-center gap-2.5 self-start text-[15px]">
              {/* El anillo que gira mientras piensa (handoff). */}
              <span
                aria-hidden="true"
                className="border-primary/25 border-t-primary size-4 animate-spin rounded-full border-2 [animation-duration:900ms] motion-reduce:animate-none"
              />
              {t.thinking}
            </p>
          ) : null}
          <div ref={endRef} />
        </div>
      )}

      {/* El campo va al fondo, con el envio DENTRO (handoff). */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(message);
        }}
        className="surface-card sticky bottom-0 flex flex-col gap-3 p-3"
      >
        <label className="sr-only" htmlFor="copilot-pregunta">
          {t.inputPlaceholder}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="copilot-pregunta"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              /* Enter envia; Mayus+Enter salta de linea. Es lo que espera
                 quien escribe en un chat, y sin esto Enter no hacia nada. */
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(message);
              }
            }}
            placeholder={t.inputPlaceholder}
            maxLength={500}
            rows={1}
            className="placeholder:text-subtle-foreground max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-[1.5] outline-none"
          />
          <Button
            type="submit"
            variant="brand"
            size="icon"
            className="shrink-0 rounded-full"
            disabled={pending || !message.trim()}
            aria-label={t.send}
          >
            <Send aria-hidden="true" />
          </Button>
        </div>

        {empty ? (
          /* Sugerencias como pastillas pulsables cuando no hay conversacion
             (handoff). Cada una activa un motor determinista que ya existe. */
          <div className="flex flex-wrap gap-2 px-1">
            {t.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="border-border text-muted-foreground hover:border-border-strong hover:text-foreground rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-[var(--dur-fast)] active:translate-y-px"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <p className="text-subtle-foreground text-[12px] leading-relaxed text-pretty">
        <span className="font-medium">{t.limitsTitle}: </span>
        {t.limits}
      </p>
    </div>
  );
}
