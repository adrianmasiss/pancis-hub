"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { RangeBar } from "./range-bar";
import { ModelCredit } from "@/features/training/components/model-credit";
import type {
  MeasurementView,
  SegmentKey,
  SegmentView,
} from "@/features/progress/queries";
import type { DerivedSnapshot } from "@/features/progress/lib/composition";

/**
 * La lectura del cuerpo: el maniquí a la izquierda y el InBody a la derecha.
 *
 * El modelo entra por `dynamic` con `ssr: false` por las mismas dos razones
 * que en Entrenamiento: `three` no debe viajar en el paquete común, y WebGL
 * no existe en el servidor. Mientras llega —o si el teléfono no puede con
 * WebGL— la columna de cifras ya dice todo. El 3D es la forma bonita de leer
 * lo mismo, nunca la única.
 */
const MuscleModel = dynamic(
  () =>
    import("@/features/training/components/muscle-model").then(
      (m) => m.MuscleModel,
    ),
  {
    ssr: false,
    loading: () => <div className="muscle-model-stage" aria-hidden="true" />,
  },
);

/**
 * Qué zona del maniquí corresponde a cada perímetro de cinta.
 *
 * Esto NO es una medición segmental como la que da un InBody de gama alta:
 * es dónde se tomó la cinta. Por eso el resaltado dice «con medida», no
 * «masa magra de la zona», y el pie de la tarjeta lo deja escrito.
 */
/**
 * Qué músculos del maniquí pinta cada segmento del InBody.
 *
 * El aparato reparte el cuerpo en cinco trozos y el maniquí está hecho de
 * músculos, así que el mapeo es aproximado por definición — y el modelo no
 * distingue izquierda de derecha, de modo que un brazo pinta los dos. Con
 * datos segmentales el resaltado usa la EVALUACIÓN del propio informe, no un
 * número inventado: bajo pinta suave, normal pinta pleno.
 */
const SEGMENTO_MUSCULOS: Record<SegmentKey, string[]> = {
  brazo_izquierdo: ["biceps", "triceps", "antebrazo"],
  brazo_derecho: ["biceps", "triceps", "antebrazo"],
  tronco: ["pectoral", "abdomen", "dorsal", "lumbar", "oblicuo", "trapecio"],
  pierna_izquierda: ["cuadriceps", "isquios", "gluteo", "gemelo", "aductor"],
  pierna_derecha: ["cuadriceps", "isquios", "gluteo", "gemelo", "aductor"],
};

const SEGMENTO_ROTULO: Record<SegmentKey, string> = {
  brazo_izquierdo: "Brazo izquierdo",
  brazo_derecho: "Brazo derecho",
  tronco: "Tronco",
  pierna_izquierda: "Pierna izquierda",
  pierna_derecha: "Pierna derecha",
};

/* El peso del resaltado sale de la evaluación impresa. Sin evaluación pero
   con kilos, se pinta pleno: hay dato, sólo falta el juicio. */
const PESO_EVALUACION: Record<string, number> = {
  bajo: 0.45,
  normal: 1,
  alto: 1,
};

const ZONAS: {
  campo: keyof MeasurementView;
  rotulo: string;
  musculos: string[];
}[] = [
  { campo: "chestCm", rotulo: "Pecho", musculos: ["pectoral"] },
  { campo: "waistCm", rotulo: "Cintura", musculos: ["abdomen", "oblicuo"] },
  { campo: "hipCm", rotulo: "Cadera", musculos: ["gluteo"] },
  { campo: "armCm", rotulo: "Brazo", musculos: ["biceps", "triceps"] },
  { campo: "thighCm", rotulo: "Muslo", musculos: ["cuadriceps", "isquios"] },
];

const num = (valor: number | null | undefined, decimales = 1) =>
  valor == null
    ? null
    : valor.toLocaleString("es-419", { maximumFractionDigits: decimales });

/* El rótulo dice de dónde salió la lectura. Llamar «InBody» a un pesaje
   manual sería atribuirle una precisión que no tiene. */
const FUENTES: Record<string, string> = {
  inbody: "Lectura del InBody",
  bascula: "Lectura de la báscula",
  manual: "Medición manual",
  onboarding: "Medición inicial",
  otro: "Medición registrada",
};

export function BodyCompositionCard({
  measurement,
  snapshot,
  fechaLegible,
}: {
  measurement: MeasurementView;
  snapshot: DerivedSnapshot | null;
  fechaLegible: string;
}) {
  const [view, setView] = useState<"front" | "back">("front");

  /*
    Con análisis segmental manda el segmental: es lo que hace útil el muñeco
    del informe. Sin él se cae a los perímetros de cinta, que es lo único que
    queda. Peso 1 en lo medido y 0 en lo que falta: el maniquí responde a lo
    que hay, no a una escala inventada.
  */
  const segmentos = measurement.segments;
  const resaltado = useMemo(() => {
    const mapa: Record<string, number> = {};
    if (segmentos.length > 0) {
      for (const seg of segmentos) {
        if (seg.leanMassKg == null) continue;
        const peso = seg.evaluation
          ? (PESO_EVALUACION[seg.evaluation] ?? 1)
          : 1;
        for (const musculo of SEGMENTO_MUSCULOS[seg.segment]) {
          mapa[musculo] = Math.max(mapa[musculo] ?? 0, peso);
        }
      }
      return mapa;
    }
    for (const zona of ZONAS) {
      if (measurement[zona.campo] != null) {
        for (const musculo of zona.musculos) mapa[musculo] = 1;
      }
    }
    return mapa;
  }, [measurement, segmentos]);

  const medidas = ZONAS.map((zona) => ({
    rotulo: zona.rotulo,
    valor: num(measurement[zona.campo] as number | null, 1),
  }));
  const sinMedir = medidas.filter((m) => m.valor === null).length;

  const rangos = measurement.referenceRanges ?? {};
  const r = (clave: string) => rangos[clave];

  /*
    Lo esencial, siempre a la vista: las cinco cifras que deciden (peso,
    músculo, grasa en kilos y en porcentaje, IMC). Son las filas de los
    análisis de músculo-grasa y de obesidad del informe, sin repetir el peso
    ni la masa grasa que el papel imprime dos veces.
  */
  const esencial = [
    {
      rotulo: "Peso",
      valor: measurement.weightKg,
      unidad: "kg",
      rango: r("weightKg"),
    },
    {
      rotulo: "Masa muscular esquelética",
      valor: measurement.skeletalMuscleKg,
      unidad: "kg",
      rango: r("skeletalMuscleKg"),
    },
    {
      rotulo: "Masa grasa corporal",
      valor: snapshot?.fatMassKg ?? null,
      unidad: "kg",
      rango: r("fatMassKg"),
    },
    {
      rotulo: "Porcentaje de grasa corporal",
      valor: measurement.bodyFatPercentage,
      unidad: "%",
      rango: r("bodyFatPercentage"),
    },
    { rotulo: "IMC", valor: measurement.bmi, unidad: "kg/m²", rango: r("bmi") },
  ];

  /* El resto del informe es de consulta: va plegado, y cada grupo dice en
     su línea de resumen lo que trae, para no tener que abrirlo a ciegas. */
  const composicion = [
    {
      rotulo: "Agua corporal total",
      valor: measurement.totalBodyWaterL,
      unidad: "L",
      rango: r("totalBodyWaterL"),
    },
    {
      rotulo: "Proteínas",
      valor: measurement.proteinKg,
      unidad: "kg",
      rango: r("proteinKg"),
    },
    {
      rotulo: "Minerales",
      valor: measurement.mineralKg,
      unidad: "kg",
      rango: r("mineralKg"),
      decimales: 2,
    },
  ];

  const investigacion = [
    {
      rotulo: "Tasa metabólica basal",
      valor: measurement.basalMetabolicRateKcal,
      unidad: "kcal",
      rango: r("basalMetabolicRateKcal"),
      decimales: 0,
    },
    {
      rotulo: "Relación cintura-cadera",
      valor: measurement.waistHipRatio,
      unidad: "",
      rango: r("waistHipRatio"),
      decimales: 2,
    },
    {
      rotulo: "Nivel de grasa visceral",
      valor: measurement.visceralFatLevel,
      unidad: "",
      rango: r("visceralFatLevel"),
      decimales: 0,
    },
  ];

  const control = [
    { rotulo: "Peso ideal", valor: measurement.idealWeightKg, unidad: "kg" },
    {
      rotulo: "Control de peso",
      valor: measurement.weightControlKg,
      unidad: "kg",
      firmado: true,
    },
    {
      rotulo: "Control de grasa",
      valor: measurement.fatControlKg,
      unidad: "kg",
      firmado: true,
    },
    {
      rotulo: "Control de músculo",
      valor: measurement.muscleControlKg,
      unidad: "kg",
      firmado: true,
    },
  ].filter((f) => f.valor !== null);

  const firmar = (valor: number | null, unidad: string) =>
    valor === null ? "—" : `${valor > 0 ? "+" : ""}${num(valor, 1)} ${unidad}`;
  const resumen = (
    filas: { rotulo: string; valor: number | null; unidad: string }[],
    cortos: string[],
    decimales: number[] = [],
  ) =>
    filas
      .map((f, i) =>
        f.valor === null
          ? null
          : `${cortos[i]} ${num(f.valor, decimales[i] ?? 1)}${f.unidad ? ` ${f.unidad}` : ""}`,
      )
      .filter(Boolean)
      .join(" · ");
  const medidos = medidas.filter((m) => m.valor !== null);

  return (
    <section className="v11-card progress-body-card" aria-labelledby="pb-title">
      <header className="progress-body-head">
        <div>
          <h2 id="pb-title">Tu cuerpo hoy</h2>
          <p className="progress-body-meta">{fechaLegible}</p>
        </div>
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
      </header>

      <div className="progress-body-grid">
        {/* `muscle-model` no es decorativa: aporta el `position: relative` y
            la altura sobre los que se dimensiona el lienzo de WebGL. Sin ella
            el canvas se desborda y tapa la columna de cifras. */}
        <div
          className="muscle-model progress-body-model"
          role="group"
          aria-label={
            Object.keys(resaltado).length
              ? `Modelo anatómico. Zonas con medida registrada: ${medidas
                  .filter((m) => m.valor !== null)
                  .map((m) => m.rotulo)
                  .join(", ")}.`
              : "Modelo anatómico, sin perímetros registrados."
          }
        >
          <MuscleModel
            highlight={resaltado}
            view={view}
            onViewChange={setView}
          />
          <ModelCredit />
        </div>

        <div className="progress-body-readout">
          <div className="progress-readout-top">
            <h3 className="progress-subhead">
              {FUENTES[measurement.source] ?? "Medición registrada"}
            </h3>
            {/* La puntuación es el titular del informe: un solo número que
                resume la evaluación entera. Va arriba y grande. */}
            {measurement.inbodyScore != null ? (
              <p className="progress-score">
                <strong>{measurement.inbodyScore}</strong>
                <span>/ 100 puntos</span>
              </p>
            ) : null}
          </div>

          <Seccion filas={esencial} />

          <div className="progress-report">
            <Plegable
              titulo="Composición"
              resumen={resumen(
                composicion,
                ["Agua", "Proteínas", "Minerales"],
                [1, 1, 2],
              )}
            >
              <Seccion filas={composicion} />
            </Plegable>

            <Plegable
              titulo="Parámetros de investigación"
              resumen={resumen(
                investigacion,
                ["TMB", "Cintura-cadera", "Visceral"],
                [0, 2, 0],
              )}
            >
              <Seccion filas={investigacion} />
            </Plegable>

            {control.length > 0 ? (
              <Plegable
                titulo="Control de peso"
                resumen={control
                  .map((f) =>
                    f.firmado
                      ? `${f.rotulo.replace("Control de ", "")} ${firmar(f.valor, f.unidad)}`
                      : `Ideal ${num(f.valor, 1)} ${f.unidad}`,
                  )
                  .join(" · ")}
              >
                <ul className="progress-control">
                  {control.map(({ rotulo, valor, unidad, firmado }) => (
                    <li key={rotulo}>
                      <span>{rotulo}</span>
                      <strong
                        data-direction={
                          firmado && valor !== null
                            ? valor > 0
                              ? "sube"
                              : valor < 0
                                ? "baja"
                                : "estable"
                            : undefined
                        }
                      >
                        {firmado
                          ? firmar(valor, unidad)
                          : `${num(valor, 1)} ${unidad}`}
                      </strong>
                    </li>
                  ))}
                </ul>
              </Plegable>
            ) : null}

            <Plegable
              titulo="Perímetros"
              resumen={
                medidos.length
                  ? medidos.map((m) => `${m.rotulo} ${m.valor} cm`).join(" · ")
                  : "Sin medidas de cinta"
              }
            >
              <ul className="progress-perimeters">
                {medidas.map(({ rotulo, valor }) => (
                  <li
                    key={rotulo}
                    data-missing={valor === null ? "" : undefined}
                  >
                    <span>{rotulo}</span>
                    <strong>{valor === null ? "—" : `${valor} cm`}</strong>
                  </li>
                ))}
              </ul>
              {segmentos.length === 0 ? (
                <p className="progress-body-note">
                  Las zonas resaltadas señalan dónde hay una medida de cinta, no
                  la masa de cada segmento.
                  {sinMedir > 0
                    ? ` Te faltan ${sinMedir} de ${medidas.length} perímetros.`
                    : ""}
                </p>
              ) : null}
            </Plegable>

            {/* El análisis segmental, con la misma lectura que imprime el
                aparato: kilos, porcentaje sobre lo ideal y evaluación. El
                porcentaje y la evaluación vienen del InBody, no se calculan
                aquí: dependen de un ideal por altura, sexo y edad. Magra y
                grasa en una sola tabla: son las mismas cinco filas. */}
            {segmentos.length > 0 ? (
              <Plegable
                titulo="Análisis segmental"
                resumen="Masa magra y grasa por brazo, tronco y pierna"
              >
                <SegmentTable
                  segmentos={segmentos}
                  conGrasa={segmentos.some((seg) => seg.fatMassKg != null)}
                />
                <p className="progress-body-note">
                  El maniquí reparte los cinco segmentos del informe entre los
                  músculos que los forman; no distingue izquierda de derecha,
                  así que un brazo pinta los dos.
                </p>
              </Plegable>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** El análisis segmental: una fila por segmento, magra y grasa lado a lado. */
function SegmentTable({
  segmentos,
  conGrasa,
}: {
  segmentos: SegmentView[];
  conGrasa: boolean;
}) {
  return (
    <table className="progress-segment-table">
      <thead>
        <tr>
          <th scope="col">Segmento</th>
          <th scope="col">Magra</th>
          {conGrasa ? <th scope="col">Grasa</th> : null}
          <th scope="col">
            <span className="sr-only">Evaluación</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {segmentos.map((seg) => (
          <tr key={seg.segment} data-evaluation={seg.evaluation ?? undefined}>
            <th scope="row">{SEGMENTO_ROTULO[seg.segment]}</th>
            <td>
              <strong>
                {seg.leanMassKg == null ? "—" : `${num(seg.leanMassKg, 2)} kg`}
              </strong>
              {seg.leanPercent != null ? (
                <small>{num(seg.leanPercent, 1)} %</small>
              ) : null}
            </td>
            {conGrasa ? (
              <td>
                <strong>
                  {seg.fatMassKg == null ? "—" : `${num(seg.fatMassKg, 2)} kg`}
                </strong>
                {seg.fatPercent != null ? (
                  <small>{num(seg.fatPercent, 1)} %</small>
                ) : null}
              </td>
            ) : null}
            <td>
              {seg.evaluation ? (
                <span className="progress-segment-badge">{seg.evaluation}</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Un grupo del informe, plegado: el título y una línea con lo que trae. Es
 * `<details>` nativo, así que se abre con teclado y lector de pantalla sin
 * código propio.
 */
function Plegable({
  titulo,
  resumen,
  children,
}: {
  titulo: string;
  resumen: string;
  children: React.ReactNode;
}) {
  return (
    <details className="progress-fold">
      <summary>
        <span className="progress-fold-text">
          <strong>{titulo}</strong>
          {resumen ? <span>{resumen}</span> : null}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="progress-fold-body">{children}</div>
    </details>
  );
}

/** Filas del informe, cada una con su barra de rango. */
function Seccion({
  filas,
}: {
  filas: {
    rotulo: string;
    valor: number | null;
    unidad: string;
    rango?: [number, number];
    decimales?: number;
  }[];
}) {
  const conDato = filas.filter((f) => f.valor !== null);
  if (conDato.length === 0) return null;
  return (
    <ul className="progress-ranges">
      {conDato.map(({ rotulo, valor, unidad, rango, decimales }) => (
        <li key={rotulo}>
          <span className="progress-range-name">{rotulo}</span>
          <RangeBar
            value={valor as number}
            range={rango}
            unit={unidad}
            decimals={decimales ?? 1}
          />
        </li>
      ))}
    </ul>
  );
}
