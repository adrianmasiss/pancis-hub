import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
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
      <PageHeader
        icon={TrendingUp}
        title={t.title}
        description="Lleva un registro de tus mediciones y compara tu progreso en el tiempo."
        actions={<MeasurementFormDialog />}
      />

      {hasData ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.chartTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {data.composition ? (
            <CompositionSection report={data.composition} />
          ) : null}

          {data.fatMassSeries.length >= 2 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {t.composition.chartTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompositionChart
                  fatMass={data.fatMassSeries}
                  leanMass={data.leanMassSeries}
                />
              </CardContent>
            </Card>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{t.historyTitle}</h2>
            <MeasurementsTable measurements={data.measurements} />
            <p className="text-muted-foreground text-xs text-balance">
              {t.inbodyNotice}
            </p>
          </section>
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
