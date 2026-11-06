"use client";

import { useState } from "react";
import type { ProgressData } from "@/features/progress/queries";
import type { PrimaryGoal } from "@/features/progress/lib/composition";
import { BodyCard, PRINCIPAL_KEYS, medicionDelCuerpo } from "./body";
import { ScanExtras } from "./scan-detail";
import { ScanHistory } from "./scans";
import { Trends } from "./trends";

/**
 * Resumen de Progreso: el cuerpo de la ultima medicion con composicion (con
 * su vista por segmento si el InBody la trae),
 * lo demas de ese escaneo plegado (con sus
 * fotos), la tendencia y los ultimos escaneos. Agregar va por el «+».
 */
export function ProgressSummary({
  data,
  today,
  goal,
}: {
  data: ProgressData;
  today: string;
  goal: PrimaryGoal | null;
}) {
  const meds = data.measurements;
  const cuerpo = medicionDelCuerpo(meds);
  const [extras, setExtras] = useState(false);

  if (!cuerpo) {
    return (
      <div className="m-body">
        <section className="m-card m-rest-empty">
          <p className="m-sheet-text">
            Aún no hay mediciones. Toca «+» para importar tu InBody, anotar tu
            peso o subir una foto.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="m-body m-stagger m-prog-summary">
      <BodyCard
        measurements={meds}
        goal={goal}
        onVerTodo={() => {
          setExtras(true);
          document
            .getElementById("m-prog-extras-card")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <ScanExtras
        measurement={cuerpo}
        photos={data.photos}
        measurements={meds}
        omit={PRINCIPAL_KEYS}
        open={extras}
        onOpenChange={setExtras}
      />
      <Trends measurements={meds} goal={goal} today={today} />
      <ScanHistory measurements={meds} />
    </div>
  );
}
