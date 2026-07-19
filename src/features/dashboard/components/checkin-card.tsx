import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.checkin;

export function CheckinCard({ data }: { data: DashboardData }) {
  const checkin = data.checkinToday;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {t.title}
          {checkin ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              {t.done}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checkin ? (
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              label={t.sleep}
              value={
                checkin.sleepHours !== null
                  ? `${checkin.sleepHours} ${t.hours}`
                  : "—"
              }
            />
            <MetricCard
              label={t.hunger}
              value={
                checkin.hunger !== null ? `${checkin.hunger}${t.outOf5}` : "—"
              }
            />
            <MetricCard
              label={t.energy}
              value={
                checkin.energy !== null ? `${checkin.energy}${t.outOf5}` : "—"
              }
            />
            <MetricCard
              label={t.stress}
              value={
                checkin.stress !== null ? `${checkin.stress}${t.outOf5}` : "—"
              }
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {messages.emptyStates.checkins.description}
            </p>
            <Button asChild size="sm">
              <Link href="/diario">{t.pendingAction}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
