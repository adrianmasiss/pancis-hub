import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { WeightTrendChart } from "@/components/charts/weight-trend-chart";
import { CompositionChart } from "@/components/charts/composition-chart";
import { CompositionSection } from "@/features/progress/components/composition-section";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import { MeasurementsTable } from "@/features/progress/components/measurements-table";
import { PhotosSection } from "@/features/progress/components/photos-section";
import { WellbeingForm } from "@/features/progress/components/wellbeing-form";
import { getProgressData } from "@/features/progress/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.progress;
const d = messages.dashboard.progress;

export const metadata: Metadata = { title: t.title };

function signed(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value} kg`;
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getProgressData(user.id);
  const hasData = data.measurements.length > 0;

  return (
    <>
      {/* Sin icono ni frase de presentacion: la barra superior y el riel ya
          dicen donde estas, y "lleva un registro de tus mediciones" no decia
          nada que la pantalla no dijera sola. */}
      <PageHeader title={t.title} actions={<MeasurementFormDialog />} />

      {hasData ? (
        <>
          <Section title={t.chartTitle}>
            <div className="space-y-4">
              {/* Las tres lecturas SI son una rejilla: no es una secuencia,
                  son tres medidas del mismo peso que se comparan de un
                  vistazo. La prohibicion de rejillas es para listas. */}
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label={d.lastWeight}
                  value={
                    data.lastWeight !== null ? `${data.lastWeight} kg` : "—"
                  }
                />
                <MetricCard
                  label={t.weekLabel}
                  value={signed(data.weeklyChange)}
                  delta={
                    data.trend
                      ? {
                          text: d.trend[data.trend],
                          direction:
                            data.trend === "sube"
                              ? "up"
                              : data.trend === "baja"
                                ? "down"
                                : "flat",
                          tone: "neutral",
                        }
                      : undefined
                  }
                />
                <MetricCard
                  label={t.monthLabel}
                  value={signed(data.monthlyChange)}
                />
              </div>
              <WeightTrendChart
                daily={data.weightSeries}
                average={data.weightAverage7}
              />
            </div>
          </Section>

          {data.composition ? (
            <CompositionSection report={data.composition} />
          ) : null}

          {data.fatMassSeries.length >= 2 ? (
            <Section title={t.composition.chartTitle}>
              <CompositionChart
                fatMass={data.fatMassSeries}
                leanMass={data.leanMassSeries}
              />
            </Section>
          ) : null}

          <Section title={t.historyTitle}>
            <MeasurementsTable measurements={data.measurements} />
            <p className="text-muted-foreground mt-3 text-xs text-balance">
              {t.inbodyNotice}
            </p>
          </Section>
        </>
      ) : (
        <EmptyState
          title={t.noMeasurements}
          description={t.noMeasurementsDescription}
          icon={TrendingUp}
        />
      )}

      <WellbeingForm today={data.wellbeingToday} />

      <PhotosSection photos={data.photos} />
    </>
  );
}
