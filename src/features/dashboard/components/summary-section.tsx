import { Badge } from "@/components/ui/badge";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard;

function greetingForHour(hour: number): string {
  if (hour < 12) return t.greetingMorning;
  if (hour < 19) return t.greetingAfternoon;
  return t.greetingEvening;
}

export function SummarySection({ data }: { data: DashboardData }) {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: data.timezone,
    }).format(now),
  );
  const longDate = new Intl.DateTimeFormat("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: data.timezone,
  }).format(now);

  const goalLabel = data.primaryGoal
    ? t.goals[data.primaryGoal as keyof typeof t.goals]
    : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greetingForHour(hour)}
            {data.displayName ? `, ${data.displayName}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm capitalize">{longDate}</p>
        </div>
        {goalLabel ? <Badge variant="secondary">{goalLabel}</Badge> : null}
      </div>
    </section>
  );
}
