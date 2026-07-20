import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  CheckinForm,
  type CheckinDefaults,
} from "@/features/checkins/components/checkin-form";
import { detectPatterns } from "@/features/checkins/lib/patterns";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.checkins;

export const metadata: Metadata = { title: t.title };

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function CheckinsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const today = todayInTimezone(profile?.timezone ?? "UTC");

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(30);

  const todayRow = (checkins ?? []).find((row) => row.date === today) ?? null;
  const defaults: CheckinDefaults | null = todayRow
    ? {
        sleepHours:
          todayRow.sleep_hours !== null ? Number(todayRow.sleep_hours) : null,
        sleepQuality: todayRow.sleep_quality,
        hunger: todayRow.hunger,
        energy: todayRow.energy,
        stress: todayRow.stress,
        soreness: todayRow.soreness,
        mood: todayRow.mood,
        nutritionAdherence: todayRow.nutrition_adherence,
        trainingCompleted: todayRow.training_completed,
        notes: todayRow.notes,
      }
    : null;

  const patterns = detectPatterns(
    (checkins ?? []).map((row) => ({
      date: row.date,
      sleepHours: row.sleep_hours !== null ? Number(row.sleep_hours) : null,
      hunger: row.hunger,
      stress: row.stress,
      soreness: row.soreness,
    })),
    new Date(`${today}T12:00:00Z`),
  );

  const history = (checkins ?? []).slice(0, 14);

  return (
    <>
      <PageHeader title={t.title} />
      <CheckinForm defaults={defaults} />

      {patterns.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-primary size-4" aria-hidden="true" />
              {t.patternsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {patterns.map((pattern) => (
                <li key={pattern}>{t.patterns[pattern]}</li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">{t.patternsNote}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.historyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ul className="divide-y">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <span className="w-24 font-medium capitalize">
                    {formatDate(row.date)}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {row.sleep_hours !== null
                      ? `${Number(row.sleep_hours)} h · `
                      : ""}
                    {t.fields.energy} {row.energy ?? "—"}/5 · {t.fields.stress}{" "}
                    {row.stress ?? "—"}/5 · {t.fields.mood} {row.mood ?? "—"}/5
                    {row.training_completed !== null
                      ? ` · ${t.fields.trainingCompleted} ${row.training_completed ? t.fields.yes : t.fields.no}`
                      : ""}
                  </span>
                  {row.notes ? (
                    <span className="text-muted-foreground w-full text-xs italic">
                      {row.notes}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{t.noHistory}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
