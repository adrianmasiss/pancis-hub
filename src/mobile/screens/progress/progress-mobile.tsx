import { getProgressData } from "@/features/progress/queries";
import { ScreenHeader } from "@/mobile/shell/screen-header";
import { ProgressSummary } from "./summary";
import { ProgressEvidence } from "./evidence";
import { ProgressFab } from "./progress-fab";
import { ScansList } from "./scans";
import { ProgressSegment, type ProgressTab } from "./segment";

/**
 * Progreso en telefono: Resumen (el cuerpo con sus cifras, los rangos del
 * InBody, la tendencia y las mediciones), Escaneos (cada medicion entera) y
 * Fotos (con comparador). El «+» agrega cualquiera de las tres cosas.
 */
export async function ProgressMobile({
  userId,
  vista,
  abierta,
  aiEnabled,
  today,
}: {
  userId: string;
  vista: string | undefined;
  /** El escaneo que llega abierto desde el historial (`?m=`). */
  abierta: string | null;
  aiEnabled: boolean;
  today: string;
}) {
  // «Evidencia» es la biblioteca de estudios (/evidencia); las fotos se
  // llaman «Fotos». `vista=evidencia` sigue valiendo para enlaces viejos.
  const tab: ProgressTab =
    vista === "fotos" || vista === "evidencia"
      ? "fotos"
      : vista === "escaneos"
        ? "escaneos"
        : "resumen";
  const data = await getProgressData(userId);

  let body: React.ReactNode;
  if (tab === "escaneos") {
    body = (
      <ScansList
        measurements={data.measurements}
        photos={data.photos}
        initialOpen={abierta}
      />
    );
  } else if (tab === "fotos") {
    body = (
      <ProgressEvidence photos={data.photos} measurements={data.measurements} />
    );
  } else {
    body = <ProgressSummary data={data} today={today} goal={data.goal} />;
  }

  return (
    <div className="m-screen">
      <ScreenHeader
        title="Progreso"
        subtitle={
          tab === "fotos"
            ? "Tus fotos son privadas: solo tú las ves"
            : tab === "escaneos"
              ? "Cada medición con todas sus cifras"
              : "Tu cuerpo y tu constancia"
        }
      />
      <div className="m-body" style={{ paddingBottom: 0 }}>
        <ProgressSegment active={tab} />
      </div>
      {body}
      <ProgressFab
        measurements={data.measurements}
        today={today}
        aiEnabled={aiEnabled}
      />
    </div>
  );
}
