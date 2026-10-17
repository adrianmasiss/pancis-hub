import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type {
  CompositionMetric,
  CompositionReport,
} from "@/features/progress/lib/composition";

/**
 * El antes y el después de dos InBody.
 *
 * Sólo se dibuja con una medición anterior: sin ella no hay comparación que
 * hacer, y una barra contra sí misma dice cero. La dirección de la flecha es
 * el HECHO (subió o bajó) y el color es el JUICIO (favorable o no), que no
 * son lo mismo: bajar grasa es favorable y bajar músculo no lo es. Por eso el
 * color nunca va solo — lo acompañan la flecha y el texto.
 */
const ROTULOS: Partial<Record<CompositionMetric, string>> = {
  weightKg: "Peso",
  bodyFatPercentage: "Grasa corporal",
  fatMassKg: "Masa grasa",
  skeletalMuscleKg: "Masa muscular",
  leanMassKg: "Masa magra",
  visceralFatLevel: "Grasa visceral",
  bodyWaterPercentage: "Agua corporal",
  waistCm: "Cintura",
};

const UNIDADES: Partial<Record<CompositionMetric, string>> = {
  weightKg: "kg",
  bodyFatPercentage: "%",
  fatMassKg: "kg",
  skeletalMuscleKg: "kg",
  leanMassKg: "kg",
  visceralFatLevel: "",
  bodyWaterPercentage: "%",
  waistCm: "cm",
};

const fmt = (n: number, decimales = 1) =>
  n.toLocaleString("es-419", { maximumFractionDigits: decimales });

export function InbodyComparison({
  report,
  fechaAnterior,
  fechaActual,
}: {
  report: CompositionReport;
  fechaAnterior: string;
  fechaActual: string;
}) {
  /*
    Grasa corporal y masa muscular primero: son las dos que dicen si el
    trabajo va bien. El peso solo no distingue perder grasa de perder
    músculo, así que encabezar con él es encabezar con la cifra más fácil de
    malinterpretar.
  */
  const PRIORIDAD: CompositionMetric[] = [
    "bodyFatPercentage",
    "skeletalMuscleKg",
    "fatMassKg",
    "leanMassKg",
    "weightKg",
    "waistCm",
    "visceralFatLevel",
    "bodyWaterPercentage",
  ];
  const filas = report.comparisons
    .filter((c) => c.previous !== null && c.deltaPrevious !== null)
    .sort((a, b) => PRIORIDAD.indexOf(a.metric) - PRIORIDAD.indexOf(b.metric));
  if (filas.length === 0) return null;

  return (
    <section
      className="v11-card progress-compare-card"
      aria-labelledby="pc-title"
    >
      <header className="progress-card-head">
        <div>
          <h2 id="pc-title">Cambio desde tu medición anterior</h2>
          <p className="progress-card-meta">
            {fechaAnterior} → {fechaActual}
          </p>
        </div>
        {report.isRecomposition && (
          <span className="progress-recomp-badge">
            Recomposición: menos grasa y más músculo a la vez
          </span>
        )}
      </header>

      <ul className="progress-compare-list">
        {filas.map((fila) => {
          const unidad = UNIDADES[fila.metric] ?? "";
          const delta = fila.deltaPrevious as number;
          const previo = fila.previous as number;
          /* La barra compara las dos lecturas entre sí, no contra cero: con
             el cero dentro, un cambio de 200 g en 80 kg era invisible. */
          const max = Math.max(fila.current, previo);
          const min = Math.min(fila.current, previo);
          const rango = max - min || 1;
          const anchoPrev = 30 + ((previo - min) / rango) * 70;
          const anchoActual = 30 + ((fila.current - min) / rango) * 70;
          const Icono =
            fila.direction === "sube"
              ? ArrowUpRight
              : fila.direction === "baja"
                ? ArrowDownRight
                : Minus;
          return (
            <li key={fila.metric} data-assessment={fila.assessment}>
              <div className="progress-compare-label">
                <span>{ROTULOS[fila.metric] ?? fila.metric}</span>
                <strong>
                  <Icono size={14} aria-hidden="true" />
                  {delta > 0 ? "+" : ""}
                  {fmt(delta, fila.metric === "visceralFatLevel" ? 0 : 1)}{" "}
                  {unidad}
                </strong>
              </div>
              {/* La barra vive DENTRO de una pista de ancho fijo. Suelta en
                  la fila, su porcentaje se medía contra la fila entera y al
                  100% empujaba la cifra fuera del borde. */}
              <div className="progress-compare-bars">
                <span className="progress-bar-row">
                  <span className="progress-bar-track">
                    <i
                      className="progress-bar is-prev"
                      style={{ width: `${anchoPrev}%` }}
                      aria-hidden="true"
                    />
                  </span>
                  <small>
                    {fmt(previo)} {unidad}
                  </small>
                </span>
                <span className="progress-bar-row">
                  <span className="progress-bar-track">
                    <i
                      className="progress-bar is-current"
                      style={{ width: `${anchoActual}%` }}
                      aria-hidden="true"
                    />
                  </span>
                  <small>
                    {fmt(fila.current)} {unidad}
                  </small>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="progress-card-note">
        Los cambios por debajo del umbral de ruido de la báscula se marcan como
        estables: no se afirma un movimiento que el método no puede medir.
      </p>
    </section>
  );
}
