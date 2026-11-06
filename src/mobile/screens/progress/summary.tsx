"use client";

import type { ProgressData } from "@/features/progress/queries";
import type { PrimaryGoal } from "@/features/progress/lib/composition";
import {
  BodyCard,
  PRINCIPAL_KEYS,
  conSegmentos,
  medicionDelCuerpo,
} from "./body";
import { RangeCards } from "./ranges";
import { ScanExtras } from "./scan-detail";
import { ScanHistory } from "./scans";
import { Trends } from "./trends";

/**
 * Resumen de Progreso: el cuerpo de la ultima medicion con composicion (por
 * segmento si el InBody lo trae; si no, el maniqui con las cifras al lado),
 * las cuatro tarjetas con su rango, lo demas de ese escaneo plegado (con sus
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
      <BodyCard measurements={meds} goal={goal} />
      <RangeCards measurements={meds} goal={goal} />
      <ScanExtras
        measurement={cuerpo}
        photos={data.photos}
        measurements={meds}
        omit={conSegmentos(cuerpo) ? [] : PRINCIPAL_KEYS}
      />
      <Trends measurements={meds} goal={goal} today={today} />
      <ScanHistory measurements={meds} />
    </div>
  );
}
