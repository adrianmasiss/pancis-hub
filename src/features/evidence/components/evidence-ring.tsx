"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EvidenceSpine } from "@/features/evidence/queries";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.evidence;

/** Cada capa tiene su tinta, y es la misma que rotula la seccion de abajo. */
const LAYER_TONE: Record<number, string> = {
  1: "var(--positive)",
  2: "var(--caution)",
  3: "var(--primary)",
};

/**
 * El anillo de lomos del handoff: las fuentes en perspectiva, la de delante
 * legible y las de detras oscureciendose al alejarse.
 *
 * La geometria es la del prototipo, literal. Transformacion por lomo, con
 * `off` = distancia al seleccionado envuelta a la vuelta mas corta:
 *
 *   translateX(off * 232px) translateZ(-|off| * 190px)
 *   rotateY(-off * 34deg)   scale(1 - |off| * 0.06)
 *
 * NO gira solo. El README dice que gira y se pausa al pasar el raton; el
 * prototipo lo mueve al pulsar, y esa version es la buena: perseguir con el
 * cursor algo que se mueve para poder pulsarlo es hostil, y una rotacion
 * permanente a pantalla completa es justo lo que `prefers-reduced-motion`
 * existe para apagar.
 *
 * Es CSS 3D, sin three.js y sin un solo byte de modelo: el prototipo tampoco
 * usa ninguno aqui.
 */
export function EvidenceRing({ spines }: { spines: EvidenceSpine[] }) {
  const [index, setIndex] = useState(0);
  const n = spines.length;
  if (n === 0) return null;

  const active = ((index % n) + n) % n;
  const step = (delta: number) => setIndex((value) => value + delta);

  return (
    <div className="flex flex-col gap-4">
      {/*
        `role="group"` y no una lista: son controles, y las flechas mas el
        foco en cada lomo son lo que lo hace recorrible con teclado. El
        anillo es un resumen; la biblioteca completa esta en las tablas de
        abajo, asi que nadie depende de esto para llegar a un dato.
      */}
      <div
        role="group"
        aria-label={t.ring.label}
        className="relative h-[300px] overflow-hidden sm:h-[380px]"
        style={{ perspective: "1500px", perspectiveOrigin: "50% 46%" }}
      >
        {spines.map((spine, i) => {
          let off = i - active;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const a = Math.abs(off);
          const hidden = a > 2.5;
          const tone = LAYER_TONE[spine.layer] ?? "var(--primary)";

          return (
            <button
              key={spine.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={off === 0 ? "true" : undefined}
              tabIndex={hidden ? -1 : 0}
              aria-hidden={hidden || undefined}
              className="absolute top-1/2 left-1/2 h-[240px] w-[190px] rounded-[22px] border text-left transition-[transform,opacity] duration-[720ms] ease-[cubic-bezier(0.22,0.75,0.28,1)] focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none sm:h-[300px] sm:w-[230px]"
              style={{
                transform: `translate(-50%, -50%) translateX(${off * 232}px) translateZ(${-a * 190}px) rotateY(${-off * 34}deg) scale(${1 - a * 0.06})`,
                opacity: hidden ? 0 : 1 - a * 0.26,
                zIndex: 50 - Math.round(a * 10),
                pointerEvents: hidden ? "none" : "auto",
                borderColor: `color-mix(in oklab, ${tone} 34%, transparent)`,
                background: `radial-gradient(120% 90% at 24% 8%, color-mix(in oklab, ${tone} 18%, transparent), transparent 62%), var(--card)`,
                boxShadow: "0 44px 90px -38px rgb(0 0 0 / 0.85)",
              }}
            >
              <span className="flex h-full flex-col gap-3 p-4 sm:p-5">
                <span className="label-micro" style={{ color: tone }}>
                  {t.layerNames[spine.layer]}
                </span>
                {/* El lomo tiene alto fijo, asi que el titulo se recorta.
                    Sin esto, un titulo de estudio largo se salia de la
                    tarjeta y empujaba la referencia fuera del lomo. El
                    titulo completo esta en la tabla de abajo. */}
                <span
                  className={cn(
                    "min-h-0 flex-1 overflow-hidden leading-[1.3] font-semibold tracking-[-0.02em] text-pretty",
                    off === 0
                      ? "line-clamp-6 text-[17px]"
                      : "line-clamp-5 text-[14px]",
                  )}
                >
                  {spine.title}
                </span>
                <span className="text-muted-foreground shrink-0 text-[12px]">
                  {spine.meta}
                </span>
                {/* La certeza, en cinco tramos. Va con su cifra al lado: una
                    barra sola obliga a contar segmentos. */}
                <span className="flex shrink-0 items-center gap-2">
                  <span className="flex flex-1 gap-1" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, bar) => (
                      <span
                        key={bar}
                        className="h-[3px] flex-1 rounded-full"
                        style={{
                          background:
                            bar < spine.confidence
                              ? tone
                              : "color-mix(in oklab, var(--foreground) 12%, transparent)",
                        }}
                      />
                    ))}
                  </span>
                  <span className="num text-subtle-foreground text-[11px]">
                    {t.ring.confidence(spine.confidence)}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={t.ring.previous}
          className="border-border text-muted-foreground hover:text-foreground hover:border-border-strong focus-visible:ring-ring grid size-10 place-items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="text-subtle-foreground label-micro" role="status">
          {t.ring.position(active + 1, n)}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={t.ring.next}
          className="border-border text-muted-foreground hover:text-foreground hover:border-border-strong focus-visible:ring-ring grid size-10 place-items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none active:translate-y-px"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
