import "@/features/progress/components/progress-workspace.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { WeightTrendChart } from "@/components/charts/weight-trend-chart";
import { BodyCompositionCard } from "@/features/progress/components/body-composition-card";
import { InbodyComparison } from "@/features/progress/components/inbody-comparison";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import { MeasurementHistory } from "@/features/progress/components/measurement-history";
import { PhotoGallery } from "@/features/progress/components/photo-gallery";
import { PhotoUploadDialog } from "@/features/progress/components/photo-upload-dialog";
import {
  ProgressNav,
  type ProgressView,
} from "@/features/progress/components/progress-nav";
import { WellbeingForm } from "@/features/progress/components/wellbeing-form";
import { getProgressData } from "@/features/progress/queries";
import { createClient } from "@/lib/supabase/server";
import { isPhone } from "@/lib/device";
import { todayInTimezone } from "@/lib/dates";
import { ProgressMobile } from "@/mobile/screens/progress/progress-mobile";
import { messages } from "@/i18n/es-419";

const t = messages.progress;

export const metadata: Metadata = { title: t.title };

/*
  `measured_at` es un DATE sin hora: `new Date("2026-07-31")` lo parsea como
  medianoche UTC y, formateado en la zona local (Costa Rica, UTC-6), retrocede
  al día 30. La misma medición salía como «31 jul» en la tabla y «30 de julio»
  en la cabecera. Formatear en UTC la deja en el día que se escribió.
*/
const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

const fechaCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(iso));

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // Telefono: Resumen y Evidencia, con los mismos datos.
  if (await isPhone()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle();
    const timezone = profile?.timezone ?? "America/Costa_Rica";
    return (
      <ProgressMobile
        userId={user.id}
        vista={params.vista}
        today={todayInTimezone(timezone)}
        timezone={timezone}
      />
    );
  }
  const VISTAS: ProgressView[] = ["resumen", "historial", "fotos", "bienestar"];
  const vista: ProgressView = VISTAS.includes(params.vista as ProgressView)
    ? (params.vista as ProgressView)
    : "resumen";
  const data = await getProgressData(user.id);
  /*
    La tarjeta del cuerpo usa la última medición CON composición, no la última
    a secas: un pesaje suelto de ayer dejaría la tarjeta con seis «Sin dato» y
    escondería el InBody de la semana pasada, que es el que tiene algo que
    contar. Si ninguna la tiene, se cae a la última y la tarjeta lo dice por
    su rótulo de fuente.
  */
  const conSegmental = data.measurements.find((m) => m.segments.length > 0);
  const conComposicion = data.measurements.find(
    (m) =>
      m.bodyFatPercentage != null ||
      m.skeletalMuscleKg != null ||
      m.bodyWaterPercentage != null,
  );
  /* Orden de preferencia: la que trae análisis segmental manda, porque es la
     única que llena el maniquí; después cualquiera con composición; y si no
     hay ninguna, la última a secas. */
  const ultima = conSegmental ?? conComposicion ?? data.measurements[0];

  return (
    <div className="progress-workspace" data-view={vista}>
      <header className="progress-header">
        <div>
          <h1>{t.title}</h1>
          <p>
            {data.measurements[0]
              ? `Tu última medición es del ${fecha(data.measurements[0].measuredAt)}.`
              : "Aún no has registrado ninguna medición."}
          </p>
        </div>
        <MeasurementFormDialog />
      </header>

      <ProgressNav active={vista} />

      {!data.measurements[0] || !ultima ? (
        <EmptyState
          size="page"
          tone="plain"
          icon={TrendingUp}
          title={t.noMeasurements}
          description={t.noMeasurementsDescription}
          action={<MeasurementFormDialog />}
        />
      ) : vista === "resumen" ? (
        <>
          <BodyCompositionCard
            measurement={ultima}
            snapshot={data.composition?.current ?? null}
            fechaLegible={fecha(ultima.measuredAt)}
          />

          {/* Cambio y tendencia, juntos: los dos responden «cómo voy», uno
              entre las dos últimas mediciones y otro a lo largo del tiempo.
              En escritorio van lado a lado; en una columna, uno tras otro. */}
          <div className="progress-pair">
            {/* Sólo con una medición anterior: sin ella no hay comparación, y
              una barra contra sí misma dice cero. */}
            {data.composition?.previous && data.measurements[1] ? (
              /* Las fechas son las que el INFORME compara —la última y la
               anterior—, no las de la tarjeta del cuerpo: esa puede estar
               mostrando una medición más vieja por ser la que trae
               composición, y mezclarlas daba un rango al revés. */
              <InbodyComparison
                report={data.composition}
                fechaAnterior={fechaCorta(data.measurements[1].measuredAt)}
                fechaActual={fechaCorta(data.measurements[0].measuredAt)}
              />
            ) : (
              <p className="progress-single-note">
                Con una sola medición no hay nada que comparar todavía. La
                segunda activa el antes y el después.
              </p>
            )}

            <section
              className="v11-card progress-trend-card"
              aria-labelledby="pt-title"
            >
              <header className="progress-card-head">
                <div>
                  <h2 id="pt-title">Evolución del peso</h2>
                  <p className="progress-card-meta">
                    {data.measurements.length}{" "}
                    {data.measurements.length === 1 ? "medición" : "mediciones"}{" "}
                    registradas
                  </p>
                </div>
              </header>
              <WeightTrendChart
                daily={data.weightSeries}
                average={data.weightAverage7}
              />
            </section>
          </div>
        </>
      ) : vista === "historial" ? (
        <section
          className="v11-card progress-history-card"
          aria-labelledby="ph-title"
        >
          <header className="progress-card-head">
            <div>
              <h2 id="ph-title">{t.historyTitle}</h2>
              <p className="progress-card-meta">
                Cada medición con sus cifras, su archivo original y las fotos de
                ese día.
              </p>
            </div>
          </header>
          <MeasurementHistory
            measurements={data.measurements}
            photos={data.photos}
          />
          <p className="progress-card-note">{t.inbodyNotice}</p>
        </section>
      ) : vista === "fotos" ? (
        <section
          className="v11-card progress-photos-card"
          aria-labelledby="pf-title"
        >
          <header className="progress-card-head">
            <div>
              <h2 id="pf-title">Todas tus fotos</h2>
              <p className="progress-card-meta">
                Agrupadas por fecha, de la más reciente a la más antigua.
              </p>
            </div>
            <PhotoUploadDialog
              measurements={data.measurements.map((m) => ({
                id: m.id,
                measuredAt: m.measuredAt,
              }))}
            />
          </header>
          {data.photos.length > 0 ? (
            <PhotoGallery photos={data.photos} />
          ) : (
            <p className="progress-card-note">
              Aún no hay fotos. Son privadas: sólo tú puedes verlas.
            </p>
          )}
        </section>
      ) : (
        <section
          className="v11-card progress-wellbeing-card"
          aria-labelledby="pw-title"
        >
          <header className="progress-card-head">
            <div>
              <h2 id="pw-title">Bienestar</h2>
              <p className="progress-card-meta">
                El sueño, el estrés y la energía explican buena parte de tu
                rendimiento y tu adherencia.
              </p>
            </div>
          </header>
          <WellbeingForm today={data.wellbeingToday} />
        </section>
      )}
    </div>
  );
}
