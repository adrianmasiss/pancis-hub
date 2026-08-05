"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/features/assistant/actions";
import type { AssistantReply } from "@/features/assistant/types";
import { messages } from "@/i18n/es-419";

const t = messages.assistant;

type ChatEntry =
  { role: "user"; text: string } | { role: "assistant"; reply: AssistantReply };

function ReplyCard({ reply }: { reply: AssistantReply }) {
  const sections: { label: string; value: string | undefined }[] = [
    { label: t.sections.observation, value: reply.observation },
    { label: t.sections.interpretation, value: reply.interpretation },
    { label: t.sections.action, value: reply.action },
    { label: t.sections.alternative, value: reply.alternative },
    { label: t.sections.reason, value: reply.reason },
    { label: t.sections.reevaluate, value: reply.reevaluate },
  ];

  return (
    <Card className="max-w-[92%] self-start">
      <CardContent className="space-y-2 py-4 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" aria-hidden="true" />
          {/*
            La etiqueta depende de si la respuesta esta fundada. Decir
            "demostrativa" debajo de fuentes de nivel A era incoherente: el
            usuario ve evidencia solida bajo un aviso de que no es real.
          */}
          <Badge variant="outline" className="font-normal">
            {reply.sources && reply.sources.length > 0
              ? t.groundedBadge
              : t.demoBadge}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {t.sections.confidence}: {t.confidences[reply.confidence]}
          </Badge>
        </div>
        {/*
          Las fuentes las resuelve el SERVIDOR desde formula_versions, no las
          escribe el modelo: por eso puede citarse sin miedo a que invente un
          estudio. La poblacion se muestra porque importa saber sobre quien se
          estudio lo que se te esta diciendo.
        */}
        <dl className="space-y-1.5">
          {sections
            .filter((section): section is { label: string; value: string } =>
              Boolean(section.value),
            )
            .map((section) => (
              <div key={section.label}>
                <dt className="text-muted-foreground text-xs font-medium">
                  {section.label}
                </dt>
                <dd>{section.value}</dd>
              </div>
            ))}
        </dl>
        {reply.sources && reply.sources.length > 0 ? (
          <div className="border-t pt-2">
            <p className="text-muted-foreground text-xs font-medium">
              {t.sections.sources}
            </p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              {reply.sources.map((source) => (
                <li key={source.title}>
                  {source.title}
                  {source.identifier ? ` · ${source.identifier}` : ""}
                  {source.evidenceGrade
                    ? ` · ${t.evidenceGrade} ${source.evidenceGrade}`
                    : ""}
                  {source.role ? (
                    <span
                      className={
                        source.role === "sustenta" ? undefined : "text-caution"
                      }
                    >
                      {" · "}
                      {t.sourceRoles[source.role] ?? source.role}
                    </span>
                  ) : null}
                  {source.isProductParameter ? (
                    <span className="text-caution"> · {t.productParameter}</span>
                  ) : null}
                  {source.population ? (
                    <span className="block italic">{source.population}</span>
                  ) : null}
                  {/*
                    La nota del revisor es lo que separa "nivel A" de lo que ese
                    nivel A realmente dice sobre esta cifra.
                  */}
                  {source.note ? (
                    <span className="block">{source.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * `initialMessage` llega desde los accesos contextuales (una comida, un
 * alimento, un ejercicio). Se PRECARGA en el campo pero NO se envia sola:
 * mandar una consulta sin que el usuario la confirme gastaria una llamada
 * al modelo por el simple hecho de tocar un boton.
 */
export function AssistantChat({
  initialMessage,
}: {
  initialMessage?: string;
}) {
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

  return (
    <div className="flex flex-col gap-4">
      <p className="bg-muted text-muted-foreground rounded-lg p-3 text-xs text-balance">
        {t.demoNotice}
      </p>

      <div className="flex min-h-64 flex-col gap-3">
        {entries.map((entry, index) =>
          entry.role === "user" ? (
            <p
              key={index}
              className="bg-brand-button text-primary-foreground max-w-[85%] self-end rounded-2xl rounded-br-sm px-4 py-2 text-sm"
            >
              {entry.text}
            </p>
          ) : (
            <ReplyCard key={index} reply={entry.reply} />
          ),
        )}
        {pending ? (
          <p className="text-muted-foreground self-start text-sm">
            {t.thinking}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      {entries.length === 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            {t.suggestionsTitle}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {t.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-3 py-1 text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(message);
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t.inputPlaceholder}
          maxLength={500}
          aria-label={t.inputPlaceholder}
        />
        <Button type="submit" disabled={pending || !message.trim()}>
          <Send className="size-4" aria-hidden="true" />
          {t.send}
        </Button>
      </form>

      <p className="text-muted-foreground text-xs text-balance">
        <span className="font-medium">{t.limitsTitle}: </span>
        {t.limits}
      </p>
    </div>
  );
}
