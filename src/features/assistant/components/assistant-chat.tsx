"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AssistantReplyCard } from "@/features/assistant/components/assistant-reply-card";
import { BrandLogo } from "@/components/shared/brand-logo";
import { askAssistant } from "@/features/assistant/actions";
import type { AssistantReply } from "@/features/assistant/types";
import { messages } from "@/i18n/es-419";

type ChatEntry =
  { role: "user"; text: string } | { role: "assistant"; reply: AssistantReply };
type Conversation = { id: string | null; title: string; entries: ChatEntry[] };
const prompts = [
  {
    tag: "CENA · 21:00",
    text: "¿Cómo cierro las 410 kcal que me quedan?",
    tone: "default",
  },
  {
    tag: "EMPUJE A",
    text: "El pectoral va al 71 %. ¿Bajo el volumen?",
    tone: "caution",
  },
  {
    tag: "PROTEÍNA",
    text: "Llevo tres días bajo el umbral en la mañana",
    tone: "positive",
  },
  {
    tag: "SUEÑO · 6 H 40",
    text: "¿Afecta esto a la sesión de hoy?",
    tone: "muted",
  },
];

export function AssistantChat({
  initialMessage,
  compact = false,
}: {
  initialMessage?: string;
  compact?: boolean;
}) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [history, setHistory] = useState<Conversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (entries.length)
      endRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "nearest",
      });
  }, [entries.length, pending]);
  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setEntries((previous) => [...previous, { role: "user", text: trimmed }]);
    setMessage("");
    startTransition(async () => {
      try {
        const result = await askAssistant({
          message: trimmed,
          conversationId: conversationId ?? undefined,
        });
        if ("error" in result) {
          toast.error(result.error);
          setMessage(trimmed);
          setEntries((previous) => previous.slice(0, -1));
        } else {
          setConversationId(result.conversationId);
          setEntries((previous) => [
            ...previous,
            { role: "assistant", reply: result.reply },
          ]);
        }
      } catch {
        toast.error("No se pudo enviar tu pregunta. Inténtalo de nuevo.");
        setMessage(trimmed);
        setEntries((previous) => previous.slice(0, -1));
      }
    });
  }
  function archive() {
    if (entries.length) {
      const first = entries.find((e) => e.role === "user");
      setHistory((previous) => [
        {
          id: conversationId,
          title: first?.role === "user" ? first.text : "Conversación",
          entries,
        },
        ...previous.filter((c) => !conversationId || c.id !== conversationId),
      ]);
    }
  }
  function newConversation() {
    archive();
    setEntries([]);
    setConversationId(null);
    setMessage("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }
  const empty = entries.length === 0;
  const composer = (
    <form
      className="assistant-composer pc-live-edge"
      onSubmit={(e) => {
        e.preventDefault();
        send(message);
      }}
    >
      <div className="assistant-input-row">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              send(message);
            }
          }}
          rows={1}
          maxLength={2000}
          aria-label="Pregunta al copiloto"
          placeholder="Pregunta lo que quieras de tu plan"
        />
      </div>
      <div className="assistant-context">
        <details className="assistant-context-menu">
          <summary aria-label="Añadir contexto">
            <Plus className="size-4" />
          </summary>
          <div>
            <Link href="/nutricion/dieta">Revisar mi dieta</Link>
            <Link href="/entrenamiento">Revisar mi rutina</Link>
            <Link href="/progreso">Registrar medición</Link>
          </div>
        </details>
        <span>
          <Sparkles className="size-3" />
          Cambios menores
        </span>
        <span>
          <Calendar className="size-3" />
          Hoy
        </span>
        {/* Enviar cierra la fila de abajo, no la del texto. Arriba quedaba a
            la altura del campo y dejaba vacio todo el canto inferior
            derecho; aqui ancla la esquina y el campo gana el ancho entero.
            Tambien aguanta mejor el campo de varias lineas: el boton se
            queda en el pie en vez de flotar contra un area que crece. */}
        <button
          data-glow
          className="assistant-send"
          type="submit"
          aria-label={messages.assistant.send}
          disabled={pending || !message.trim()}
        >
          <ArrowUpRight className="size-[18px]" />
        </button>
      </div>
    </form>
  );
  return (
    <div className="assistant-chat" data-compact={compact} data-empty={empty}>
      {!compact && (
        <header className="assistant-toolbar">
          <div className="relative">
            <button
              data-glow
              className="assistant-history-button"
              type="button"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen(!historyOpen)}
            >
              <span className="assistant-history-mark">
                <Sparkles className="size-4" />
              </span>
              Historial <span>{history.length || ""}</span>
              <ChevronDown className="size-3" />
            </button>
            {historyOpen && (
              <div className="assistant-history-popover">
                <p>Conversaciones de esta sesión</p>
                {history.length ? (
                  history.map((c, i) => (
                    <button
                      data-glow
                      type="button"
                      key={`${c.id}-${i}`}
                      onClick={() => {
                        archive();
                        setEntries(c.entries);
                        setConversationId(c.id);
                        setHistoryOpen(false);
                      }}
                    >
                      {c.title}
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    Las conversaciones que cierres con «Nueva» aparecerán aquí.
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            data-glow
            className="assistant-new"
            type="button"
            onClick={newConversation}
            disabled={pending}
          >
            <Plus className="size-4" />
            Nueva
          </button>
        </header>
      )}
      {empty ? (
        <div className="assistant-empty">
          {!compact && (
            <>
              <BrandLogo variant="mark" height={56} />
              <h1>{messages.assistant.copilot.emptyHeadline}</h1>
              <p>{messages.assistant.copilot.emptyContext}</p>
            </>
          )}
          {compact && (
            <div className="assistant-drawer-intro">
              <p>Revisemos tu día.</p>
              <span>
                Pregunta por tu dieta, entrenamiento o progreso. Las propuestas
                se revisan antes de cambiar tu plan.
              </span>
            </div>
          )}
          {composer}
          {!compact && (
            <div className="assistant-prompts">
              {prompts.map((p) => (
                <button
                  data-glow
                  key={p.tag}
                  type="button"
                  data-tone={p.tone}
                  onClick={() => {
                    setMessage(p.text);
                    inputRef.current?.focus();
                  }}
                >
                  <span>{p.tag}</span>
                  <p>{p.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            className="assistant-messages"
            role="log"
            aria-label="Conversación con el copiloto"
            aria-live="polite"
          >
            {entries.map((e, i) =>
              e.role === "user" ? (
                <p className="assistant-user-message" key={i}>
                  {e.text}
                </p>
              ) : (
                <AssistantReplyCard key={i} reply={e.reply} />
              ),
            )}
            {pending && (
              <p role="status" className="text-muted-foreground text-sm">
                {messages.assistant.thinking}
              </p>
            )}
            <div ref={endRef} />
          </div>
          <div className="assistant-bottom-composer">{composer}</div>
        </>
      )}
    </div>
  );
}
