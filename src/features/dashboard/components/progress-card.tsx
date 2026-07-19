import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { WeightTrendChart } from "@/components/charts/weight-trend-chart";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.progress;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function ProgressCard({ data }: { data: DashboardData }) {
  const { weight } = data;
  const hasData = weight.last !== null;

  const deltaDirection =
    weight.trend === "sube" ? "up" : weight.trend === "baja" ? "down" : "flat";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                label={t.lastWeight}
                value={`${weight.last!.value} kg`}
                hint={
                  weight.lastMeasurementDate
                    ? `${t.lastMeasurement}: ${formatDate(weight.lastMeasurementDate)}`
                    : undefined
                }
              />
              <MetricCard
                label={t.average7}
                value={weight.average7 !== null ? `${weight.average7} kg` : "—"}
              />
              <MetricCard
                label={t.weeklyChange}
                value={
                  weight.weeklyChange !== null
                    ? `${weight.weeklyChange > 0 ? "+" : ""}${weight.weeklyChange} kg`
                    : "—"
                }
                delta={
                  weight.trend
                    ? {
                        text: t.trend[weight.trend],
                        direction: deltaDirection,
                        tone: "neutral",
                      }
                    : undefined
                }
              />
            </div>
            <WeightTrendChart
              daily={weight.series}
              average={weight.average7Series}
            />
          </>
        ) : (
          <EmptyState
            title={t.noData}
            description={messages.emptyStates.progress.description}
            icon={TrendingUp}
            className="py-8"
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/progreso">{t.logWeight}</Link>
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
