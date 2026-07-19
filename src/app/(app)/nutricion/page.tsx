import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Utensils } from "lucide-react";
import { DateSelector } from "@/components/shared/date-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AddMealDialog } from "@/features/nutrition/components/add-meal-dialog";
import { DaySummary } from "@/features/nutrition/components/day-summary";
import { DuplicateDayButton } from "@/features/nutrition/components/duplicate-day-button";
import { MealCard } from "@/features/nutrition/components/meal-card";
import { getDayPlan } from "@/features/nutrition/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.nutrition };

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

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
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

  const { fecha } = await searchParams;
  const date = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : today;

  const plan = await getDayPlan(user.id, date);

  return (
    <>
      <PageHeader
        title={messages.nav.nutrition}
        actions={
          <>
            <DuplicateDayButton date={date} />
            <AddMealDialog date={date} />
          </>
        }
      />
      <DateSelector date={date} today={today} basePath="/nutricion" />
      <DaySummary plan={plan} />
      {plan.meals.length > 0 ? (
        <div className="space-y-4">
          {plan.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={messages.nutrition.noMealsTitle}
          description={messages.nutrition.noMealsDescription}
          icon={Utensils}
        />
      )}
    </>
  );
}
