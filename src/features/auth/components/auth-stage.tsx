"use client";

import type { CSSProperties, ReactNode } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

/**
 * El acceso, clonado de la referencia del usuario (`Download.mp4`, "SLATE").
 *
 * El modelo es el del video y no el que parece: el negro es el FONDO de la
 * pantalla, y lo que se mueve es una hoja clara que sube desde abajo con el
 * canto superior curvo. Al asentarse deja el negro asomando arriba, y ese
 * asomo es la "cabecera" que se ve al final.
 *
 * La curva se midio columna por columna sobre un fotograma del video y se
 * ajusto una cubica a los 26 puntos; el desvio maximo es 0.64 % de la altura
 * de pantalla. En el original:
 *
 *   borde izquierdo  x=0 %    y=24.3 %
 *   punto mas bajo   x=35 %   y=29.6 %
 *   punto mas alto   x=97 %   y=11.2 %
 *
 * Va como `clipPath` en `objectBoundingBox`, que es la unica forma de que la
 * MISMA curva sea responsiva: las coordenadas son fracciones de la caja de la
 * hoja, asi que el arco se estira al ancho de la ventana sin recalcular nada.
 * Es lo que permite que escritorio haga exactamente lo mismo a otro tamano.
 */
const CANTO = "M 0 0.243 C 0.48 0.37 0.74 0.24 1 0.112 L 1 1 L 0 1 Z";

type AuthStageProps = {
  /** Rotulo bajo la marca, dentro del negro. */
  eyebrow: string;
  children: ReactNode;
};

export function AuthStage({ eyebrow, children }: AuthStageProps) {
  return (
    <div className="auth-stage">
      <svg className="auth-stage-defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="auth-sheet-edge" clipPathUnits="objectBoundingBox">
            <path d={CANTO} />
          </clipPath>
        </defs>
      </svg>

      {/* La marca vive en el negro y NO dentro de la hoja: tiene que quedarse
          quieta mientras la hoja sube por delante, que es lo que hace que se
          lea como la misma pieza del splash y no como otra. */}
      <header className="auth-stage-brand">
        <span className="auth-stage-mark">
          <BrandLogo variant="mark" height={30} />
        </span>
        <span className="auth-stage-word">{messages.app.name}</span>
        <p className="auth-stage-eyebrow">{eyebrow}</p>
      </header>

      {/*
        El recorte va en una capa APARTE, de altura exactamente la pantalla, y
        no en el elemento que lleva el contenido. `objectBoundingBox` mide
        fracciones de la caja del propio elemento: si el formulario crece y la
        hoja con el, el 29.6 % deja de ser 29.6 % de pantalla y el arco baja
        mas de lo medido. Con la capa anclada a `100dvh` el arco es siempre el
        del video, y el contenido puede desbordar sin arrastrarlo.
      */}
      {/* Las dos capas suben JUNTAS dentro de un envoltorio. Animadas por
          separado, cada una se desplazaba el 100 % de SU propia altura y a
          mitad del recorrido se abria una franja negra entre ellas. */}
      <div className="auth-stage-rise" aria-hidden="true">
        <div className="auth-stage-sheet" />
        <div className="auth-stage-fill" />
      </div>

      <div className="auth-stage-col">{children}</div>
    </div>
  );
}

/**
 * Un paso de la cascada del formulario. 90 ms por puesto, que es el intervalo
 * con el que aparecen las piezas en el video (titulo, campos, boton, divisor y
 * los tres circulos sociales, uno detras de otro).
 */
export function AuthStep({
  step,
  className,
  children,
}: {
  step: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ "--step": step } as CSSProperties}
      className={cn("auth-step", className)}
    >
      {children}
    </div>
  );
}
