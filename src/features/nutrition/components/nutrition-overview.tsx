import type { ReactNode } from "react";
import type { MacroSet } from "../lib/macros";
import { NutritionSummary } from "./nutrition-summary";

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
      <NutritionSummary
        consumed={consumed}
        targets={targets}
        pending={pending}
        date={date}
        waterMl={waterMl}
        waterTargetMl={waterTargetMl}
      />
    </section>
  );
}
