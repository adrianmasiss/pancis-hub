import { Fragment, type ReactNode } from "react";
import type { MacroSet } from "../lib/macros";
import { WaterCard } from "./water-card";

/**
 * Las cuatro tarjetas comparten UNA sola estructura: rotulo, cifra, barra,
 * nota. Antes calorias llevaba la nota antes de la barra y los macros
 * despues, asi que las cuatro barras caian a alturas distintas y la fila
 * se leia torcida aunque las cajas midieran lo mismo. El orden unico es lo
 * que las alinea; la rejilla sola no basta.
 */
const axes = [
  { key: "calories", label: "Calorías", unit: "kcal" },
  { key: "proteinG", label: "Proteína", unit: "g" },
  { key: "carbohydrateG", label: "Carbohidratos", unit: "g" },
  { key: "fatG", label: "Grasas", unit: "g" },
  { key: "fiberG", label: "Fibra", unit: "g" },
] as const;
const fmt = (n: number) => Math.round(n).toLocaleString("es-419");

export function NutritionOverview({
  consumed,
  targets,
  pending,
  count,
  dateControl,
  date,
  waterMl,
  waterTargetMl,
}: {
  date: string;
  waterMl: number;
  waterTargetMl: number | null;

  consumed: MacroSet;
  targets: MacroSet | null;
  pending: MacroSet;
  count: number;
  dateControl?: ReactNode;
}) {
  return (
    <section
      className="nutrition-dashboard-summary"
      aria-label="Resumen del día"
    >
      {/* Sin titulo: las cifras se explican solas. Lo pendiente del plan vive
          en la tarjeta de calorias y la fibra tiene la suya; aqui quedan el
          conteo y la fecha. */}
      <div className="nutrition-summary-heading-row">
        <p className="nutrition-summary-caption">
          <span>
            {count} {count === 1 ? "comida registrada" : "comidas registradas"}
          </span>
        </p>
        {dateControl}
      </div>
      <div className="nutrition-summary-grid">
        {axes.map(({ key, label, unit }) => {
          const target = targets?.[key];
          const hasTarget = Boolean(target && target > 0);
          const progress = hasTarget
            ? Math.max(0, Math.min(100, (consumed[key] / target!) * 100))
            : 0;
          const note = !hasTarget
            ? "Sin objetivo configurado"
            : key === "calories"
              ? `de ${fmt(target!)} kcal · ${Math.round(progress)}% de la meta`
              : consumed[key] <= target!
                ? `${fmt(target! - consumed[key])} g restantes`
                : `${fmt(consumed[key] - target!)} g sobre la meta`;
          return (
            <Fragment key={key}>
              <div
                className="v11-card nutrition-home-card nutrition-stat"
                data-metric={key}
              >
                <h3>{label}</h3>
                <p className="nutrition-stat-value">
                  <strong>{fmt(consumed[key])}</strong>
                  <span>
                    {key !== "calories" && hasTarget ? (
                      <span className="nutrition-stat-target">
                        {` / ${fmt(target!)}`}
                      </span>
                    ) : null}{" "}
                    {unit}
                  </span>
                </p>
                {/* Lo que falta del plan es energia: va con las calorias y no
                  en una linea suelta. Solo si hay plan con algo pendiente;
                  sin dieta seria un dato inventado. */}
                {key === "calories" && pending.calories > 0 ? (
                  <p className="nutrition-stat-pending">
                    <strong>{fmt(pending.calories)}</strong> kcal pendientes del
                    plan
                  </p>
                ) : null}
                <div
                  className="nutrition-stat-track"
                  data-inert={hasTarget ? undefined : ""}
                  aria-hidden="true"
                >
                  <i style={{ width: `${progress}%` }} />
                </div>
                <p className="nutrition-stat-note">{note}</p>
              </div>
              {/* Agua va segunda, junto a calorias: las dos son las que se
                tocan durante el dia; los macros se leen. */}
              {key === "calories" ? (
                <WaterCard date={date} ml={waterMl} targetMl={waterTargetMl} />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
