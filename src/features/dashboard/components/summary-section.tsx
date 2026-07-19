import Link from "next/link";
import { CircleAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard;

function greetingForHour(hour: number): string {
  if (hour < 12) return t.greetingMorning;
  if (hour < 19) return t.greetingAfternoon;
  return t.greetingEvening;
}

type PendingAction = { label: string; href: string };

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

  const pending: PendingAction[] = [];
  if (data.mealsLoggedToday === 0) {
    pending.push({ label: t.pending.logMeal, href: "/nutricion" });
  }
  if (!data.checkinToday) {
    pending.push({ label: t.pending.completeCheckin, href: "/diario" });
  }

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

      {pending.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="text-muted-foreground size-4" />
              {t.pending.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {pending.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {data.recommendation ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-muted-foreground size-4" />
              {t.recommendation.title}
              <Badge variant="outline" className="ml-auto font-normal">
                {t.recommendation.confidence}:{" "}
                {
                  t.recommendation.confidenceLevels[
                    data.recommendation
                      .confidence as keyof typeof t.recommendation.confidenceLevels
                  ]
                }
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium">{data.recommendation.title}</p>
            <p className="text-muted-foreground text-sm">
              {data.recommendation.explanation}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
