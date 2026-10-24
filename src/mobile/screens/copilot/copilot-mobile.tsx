"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowUp,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { askAssistant } from "@/features/assistant/actions";
import { logMeal } from "@/features/nutrition/actions";
import type {
  AssistantOption,
  AssistantReply,
} from "@/features/assistant/types";
import { triggerHaptic } from "@/lib/haptics";
import { messages } from "@/i18n/es-419";
import { ScreenHeader } from "@/mobile/shell/screen-header";

type Entry =
  | { role: "user"; text: string; image?: string }
  | { role: "assistant"; reply: AssistantReply };

const SUGERENCIAS = [
  "¿Qué como? Dame opciones para lo que me queda hoy",
  "¿Cómo voy esta semana?",
  "¿Qué cambio si hoy no puedo entrenar?",
  "¿Por qué mi meta de proteína es esa?",
];

/** Reduce la foto en el telefono: 1280 px de lado mayor, JPEG al 80 %. */
async function reducirFoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * Copiloto en telefono: lo del usuario en burbuja (con su foto, si la hay),
 * la respuesta en texto plano con la accion como titular, las opciones para
 * «Usar» y el «¿Por que?» plegado con sus fuentes. Chips de sugerencia y
 * barra de vidrio con adjuntar foto y enviar. Misma accion que escritorio.
 */
export function CopilotMobile({
  initialMessage,
  draft,
  today,
}: {
  initialMessage?: string;
  /** Texto que queda escrito sin enviar (p. ej. desde un articulo). */
  draft?: string;
  today: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState(draft ?? "");
  const [image, setImage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sentInitial = useRef(false);

  const send = (text: string) => {
    const photo = image;
    const trimmed =
      text.trim() || (photo ? "¿Qué hay en esta foto y cuánto aporta?" : "");
    if (!trimmed || pending) return;
    setEntries((e) => [
      ...e,
      { role: "user", text: trimmed, image: photo ?? undefined },
    ]);
    setMessage("");
    setImage(null);
    startTransition(async () => {
      try {
        const result = await askAssistant({
          message: trimmed,
          conversationId: conversationId ?? undefined,
          image: photo ?? undefined,
        });
        if ("error" in result) {
          toast.error(result.error);
          setMessage(trimmed);
          setImage(photo);
          setEntries((e) => e.slice(0, -1));
          return;
        }
        setConversationId(result.conversationId);
        setEntries((e) => [...e, { role: "assistant", reply: result.reply }]);
      } catch {
        toast.error("No se pudo enviar tu pregunta. Inténtalo de nuevo.");
        setMessage(trimmed);
        setImage(photo);
        setEntries((e) => e.slice(0, -1));
      }
    });
  };

  /* Los accesos de otras pantallas («¿Qué como?», «Comer fuera») llegan con
     la pregunta redactada: se envia sola, una vez. */
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      sendRef.current(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (!entries.length) return;
    endRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "end",
    });
  }, [entries.length, pending]);

  return (
    <div className="m-screen m-copilot">
      <div className="m-copilot-glow" aria-hidden="true" />
      <ScreenHeader
        title="Copiloto"
        subtitle="Conoce tu plan, tu rutina y lo que comiste hoy"
      />

      <div className="m-body m-chat" aria-live="polite">
        {entries.length === 0 && !pending && (
          <div className="m-chat-empty">
            <Sparkles size={22} className="m-accent-text" aria-hidden="true" />
            <p className="m-sheet-text">
              Pregúntame qué comer, cómo vas o qué cambiar hoy, o mándame una
              foto de tu plato. Respondo con tus datos y te digo de dónde salen
              las cifras.
            </p>
          </div>
        )}
        {entries.map((entry, i) =>
          entry.role === "user" ? (
            <div key={i} className="m-bubble">
              {entry.image && (
                // eslint-disable-next-line @next/next/no-img-element -- foto local del usuario
                <img
                  src={entry.image}
                  alt="Foto adjunta"
                  className="m-bubble-photo"
                />
              )}
              {entry.text}
            </div>
          ) : (
            <Reply key={i} reply={entry.reply} today={today} />
          ),
        )}
        {pending && (
          <p className="m-sub m-thinking" role="status">
            Pensando…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="m-composer-wrap">
        <div className="m-chips-scroll" role="group" aria-label="Sugerencias">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              type="button"
              className="m-chip-toggle m-press"
              disabled={pending}
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="m-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(message);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                setImage(await reducirFoto(f));
              } catch {
                toast.error("No se pudo leer la foto.");
              }
            }}
          />
          {image ? (
            <span className="m-composer-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
              <img src={image} alt="" />
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() => setImage(null)}
              >
                <X size={12} strokeWidth={3} aria-hidden="true" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="m-icon-btn m-press m-composer-attach"
              aria-label="Adjuntar foto de comida"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={20} aria-hidden="true" />
            </button>
          )}
          <label className="sr-only" htmlFor="m-composer-input">
            Pregunta al copiloto
          </label>
          <input
            id="m-composer-input"
            className="m-composer-input"
            placeholder={
              image ? "Pregunta sobre la foto" : "Pregunta lo que sea"
            }
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
            enterKeyHint="send"
          />
          <button
            type="submit"
            className="m-icon-btn m-press"
            data-variant="primary"
            aria-label="Enviar"
            disabled={pending || (!message.trim() && !image)}
          >
            <ArrowUp size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

const t = messages.assistant;

/** «Dietary protein intake and…»: el titulo hasta ~42 letras, sin cortar palabras. */
function tituloCorto(title: string): string {
  if (title.length <= 42) return title;
  const corte = title.slice(0, 42);
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[,:;.]$/, "")}…`;
}

const ROLE: Record<string, { label: string; tone: "ok" | "warn" | "neutral" }> =
  {
    sustenta: { label: "Sostiene", tone: "ok" },
    matiza: { label: "Matiza", tone: "warn" },
    contradice: { label: "Contradice", tone: "warn" },
  };

/**
 * La respuesta: lo que ve el copiloto y la accion como titular, las opciones
 * para «Usar», y la evidencia A LA VISTA (titulo, grado, poblacion, si
 * sostiene o matiza y la nota del revisor). Solo aparecen las fuentes que
 * respaldan la respuesta; sin ninguna, se dice. El razonamiento va plegado.
 */
function Reply({ reply, today }: { reply: AssistantReply; today: string }) {
  const [open, setOpen] = useState(false);
  const sources = reply.sources ?? [];
  const basadoEn = sources.filter((s) => !s.isProductParameter).slice(0, 3);
  return (
    <article className="m-reply">
      <p className="m-sheet-text">{reply.observation}</p>
      <p className="m-reply-action">{reply.action}</p>
      {basadoEn.length > 0 && (
        <div className="m-based-on">
          {basadoEn.map((s) => (
            <Link
              key={s.identifier ?? s.title}
              href={`/evidencia?ref=${encodeURIComponent(s.identifier ?? s.title)}`}
              className="m-based-chip m-press"
            >
              <BookOpen size={13} aria-hidden="true" />
              <span>
                Basado en: <strong>{tituloCorto(s.title)}</strong>
              </span>
            </Link>
          ))}
        </div>
      )}
      {reply.options?.map((o) => (
        <OptionCard key={o.title} option={o} today={today} />
      ))}
      {reply.alternative && (
        <p className="m-sheet-text">
          <strong>{t.sections.alternative}: </strong>
          {reply.alternative}
        </p>
      )}

      <section className="m-evidence" aria-label="Evidencia">
        <div className="m-evidence-head">
          <span className="m-eyebrow">Evidencia</span>
          <Link href="/evidencia" className="m-link m-press">
            Ver biblioteca
          </Link>
        </div>
        {sources.length === 0 ? (
          <p className="m-sub" style={{ fontSize: 13 }}>
            Ningún estudio de la biblioteca respalda esta respuesta: sale de tus
            datos o es una indicación general.
          </p>
        ) : (
          <ul className="m-evidence-list">
            {sources.map((s) => {
              const role = s.role ? ROLE[s.role] : undefined;
              return (
                <li key={s.identifier ?? s.title} className="m-evidence-item">
                  {s.isProductParameter ? (
                    <span className="m-evidence-title">{s.title}</span>
                  ) : (
                    <Link
                      href={`/evidencia?ref=${encodeURIComponent(s.identifier ?? s.title)}`}
                      className="m-evidence-title m-evidence-link"
                    >
                      {s.title}
                    </Link>
                  )}
                  <span className="m-evidence-meta">
                    {s.isProductParameter ? (
                      <span className="m-tag" data-tone="neutral">
                        Criterio de la app
                      </span>
                    ) : (
                      s.evidenceGrade && (
                        <span className="m-tag" data-tone="ia">
                          Evidencia {s.evidenceGrade}
                        </span>
                      )
                    )}
                    {role && (
                      <span className="m-tag" data-tone={role.tone}>
                        {role.label}
                      </span>
                    )}
                    {s.identifier && <span>{s.identifier}</span>}
                  </span>
                  {s.population && (
                    <span className="m-evidence-note">
                      Estudiado en: {s.population}
                    </span>
                  )}
                  {s.note && <span className="m-evidence-note">{s.note}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        className="m-why m-press"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ¿Por qué?
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      {open && (
        <div className="m-stack" style={{ gap: 6 }}>
          <p className="m-sheet-text">{reply.interpretation}</p>
          <p className="m-sheet-text">{reply.reason}</p>
          <p className="m-sub">{reply.reevaluate}</p>
          <p className="m-sub">
            {t.sections.confidence}: {t.confidences[reply.confidence]}
          </p>
        </div>
      )}
    </article>
  );
}

/** Una opcion de la respuesta: «Usar» la registra en hoy (el plan no cambia). */
function OptionCard({
  option,
  today,
}: {
  option: AssistantOption;
  today: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const use = async () => {
    setState("saving");
    const result = await logMeal({
      date: today,
      mealType: "snack",
      name: option.title,
      items: option.items.map((i) => ({
        foodId: i.foodId,
        quantityG: i.grams,
      })),
    });
    if ("error" in result) {
      toast.error(result.error);
      setState("idle");
      return;
    }
    triggerHaptic("success");
    toast.success(`${option.title} sumado a hoy.`);
    setState("done");
  };
  return (
    <div className="m-option-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="m-list-row-title" style={{ whiteSpace: "normal" }}>
          {option.title}
        </div>
        <div className="m-list-row-sub m-num">
          {option.calories} kcal · P {option.proteinG} g
        </div>
        <div className="m-sub" style={{ fontSize: 12, marginTop: 2 }}>
          {option.items.map((i) => `${i.name} ${i.grams} g`).join(" · ")}
        </div>
      </div>
      <button
        type="button"
        className="m-btn m-press"
        data-variant={state === "done" ? "soft" : "primary"}
        style={{ height: 44, padding: "0 18px", fontSize: 15, flex: "none" }}
        disabled={state !== "idle"}
        onClick={use}
      >
        {state === "done" ? (
          <Check size={18} aria-label="Agregado" />
        ) : state === "saving" ? (
          "…"
        ) : (
          "Usar"
        )}
      </button>
    </div>
  );
}
