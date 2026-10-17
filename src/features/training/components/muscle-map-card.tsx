"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { V11Card, V11CardHead } from "@/components/shared/v11-card";
import {
  ROTULOS,
  resaltadoDeEjercicios,
  type EjercicioConMusculos,
} from "@/features/training/lib/muscle-map";

/**
 * El mapa muscular del dia: que se trabaja y cuanto.
 *
 * El maniqui entra por `dynamic` con `ssr: false`, y eso no es un detalle de
 * estilo:
 *
 *  - `three` pesa lo suyo. Con importacion diferida no viaja en el paquete
 *    comun: se descarga cuando alguien abre esta pantalla, y nunca si no la
 *    abre.
 *  - WebGL no existe en el servidor. Renderizarlo alli seria un fallo seguro.
 *
 * Y mientras llega —o si el telefono no puede con WebGL— la lista de musculos
 * de la derecha ya dice todo lo que el modelo dice. El 3D es la forma bonita
 * de leer lo mismo, no la unica.
 */
const MuscleModel = dynamic(
  () => import("./muscle-model").then((m) => m.MuscleModel),
  {
    ssr: false,
    loading: () => <div className="muscle-model-stage" aria-hidden="true" />,
  },
);

export function MuscleMapCard({
  exercises,
  title = "Músculos del día",
}: {
  exercises: EjercicioConMusculos[];
  title?: string;
}) {
  const [view, setView] = useState<"front" | "back">("front");
  const [elegido, setElegido] = useState<string | null>(null);

  const resaltado = useMemo(
    () => resaltadoDeEjercicios(exercises),
    [exercises],
  );
  const principales = Object.entries(resaltado)
    .filter(([, peso]) => peso >= 0.75)
    .map(([musculo]) => musculo);
  const asistentes = Object.entries(resaltado)
    .filter(([, peso]) => peso > 0 && peso < 0.75)
    .map(([musculo]) => musculo);

  const nombres = (lista: string[]) =>
    lista.map((m) => ROTULOS[m] ?? m).join(", ");

  return (
    <V11Card className="v11-padded muscle-map">
      <V11CardHead
        title={title}
        aside={
          <div
            className="body-view-toggle"
            role="group"
            aria-label="Vista del cuerpo"
          >
            <button
              type="button"
              aria-pressed={view === "front"}
              onClick={() => setView("front")}
            >
              Frontal
            </button>
            <button
              type="button"
              aria-pressed={view === "back"}
              onClick={() => setView("back")}
            >
              Posterior
            </button>
          </div>
        }
      />

      <div className="muscle-map-content">
        {/* El maniqui es una ilustracion interactiva; lo que dice en palabras
            vive al lado, asi que aqui basta con nombrarlo. */}
        <div
          className="muscle-model"
          role="group"
          aria-label={
            principales.length
              ? `Modelo anatómico. Principales: ${nombres(principales)}.${
                  asistentes.length
                    ? ` Asistentes: ${nombres(asistentes)}.`
                    : ""
                }`
              : "Modelo anatómico, sin músculos resaltados."
          }
        >
          <MuscleModel
            highlight={resaltado}
            view={view}
            onPick={setElegido}
            onViewChange={setView}
          />
        </div>

        <div className="muscle-map-list">
          <p className="muscle-map-hint">
            Arrastra para girar. Las zonas resaltadas son orientativas.
          </p>

          {principales.length ? (
            <dl>
              <div>
                <dt>
                  <span className="muscle-dot is-primary" aria-hidden="true" />
                  Principales
                </dt>
                <dd>
                  {principales.map((m) => (
                    <button
                      type="button"
                      key={m}
                      aria-pressed={elegido === m}
                      onClick={() => setElegido(m)}
                    >
                      {ROTULOS[m] ?? m}
                    </button>
                  ))}
                </dd>
              </div>
              {asistentes.length ? (
                <div>
                  <dt>
                    <span className="muscle-dot is-assist" aria-hidden="true" />
                    Asistentes
                  </dt>
                  <dd>
                    {asistentes.map((m) => (
                      <button
                        type="button"
                        key={m}
                        aria-pressed={elegido === m}
                        onClick={() => setElegido(m)}
                      >
                        {ROTULOS[m] ?? m}
                      </button>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              Cuando el día tenga ejercicios, aquí se marcan sus músculos.
            </p>
          )}

          <p className="muscle-map-picked" role="status">
            {elegido ? (ROTULOS[elegido] ?? elegido) : ""}
          </p>
        </div>
      </div>
      <details className="training-model-credit">
        <summary>Sobre el modelo 3D</summary>
        <p>
          Muscle body, de{" "}
          <a
            href="https://sketchfab.com/DB3D2534"
            target="_blank"
            rel="noreferrer"
          >
            DB3D2534
          </a>
          .{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          . Geometría optimizada y materiales adaptados. Las zonas musculares
          son una guía visual añadida por Pancis.
        </p>
        <a
          href="https://sketchfab.com/3d-models/muscle-body-48c1ae2debb4491d879ec2020096c407"
          target="_blank"
          rel="noreferrer"
        >
          Ver modelo original
        </a>
      </details>
    </V11Card>
  );
}
