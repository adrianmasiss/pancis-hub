import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.adherence;

export function AdherenceCard({ data }: { data: DashboardData }) {
  const { adherence } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label={t.checkins} value={`${adherence.checkins7} / 7`} />
          <MetricCard label={t.workouts} value={`${adherence.workouts7}`} />
          <MetricCard label={t.meals} value={`${adherence.mealDays7} / 7`} />
          <MetricCard
            label={t.streak}
            value={`${adherence.streak} ${adherence.streak === 1 ? t.day : t.days}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
