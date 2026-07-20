import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CompareTool } from "@/features/nutrition/components/compare-tool";
import { getComparisonMeals } from "@/features/nutrition/compare-queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.compare;

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

export default async function ComparePage() {
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

  const { dietMeals, todayMeals } = await getComparisonMeals(user.id, today);

  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />
      <CompareTool dietMeals={dietMeals} todayMeals={todayMeals} />
    </>
  );
}
