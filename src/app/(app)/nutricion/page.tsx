import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Utensils } from "lucide-react";
import Link from "next/link";
import { DateSelector } from "@/components/shared/date-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { AddMealDialog } from "@/features/nutrition/components/add-meal-dialog";
import { DaySummary } from "@/features/nutrition/components/day-summary";
import { SwapQuestionPanel } from "@/features/nutrition/components/swap-question-panel";
import { NutritionActionsMenu } from "@/features/nutrition/components/nutrition-actions-menu";
import { MealCard } from "@/features/nutrition/components/meal-card";
import { getDayPlan } from "@/features/nutrition/queries";
import { todayInTimezone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.nutrition };

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
      {/*
        Sin icono identitario ni frase de presentacion: la barra superior y el
        riel ya dicen donde estas, y "Gestiona tus comidas del dia" no le decia
        al usuario nada que la pantalla no dijera sola. Lo que si es contexto
        aqui es LA FECHA, asi que el selector sube a la cabecera en vez de
        quedarse como una fila suelta debajo.
      */}
      <PageHeader
        title={messages.nav.nutrition}
        actions={
          <>
            <NutritionActionsMenu date={date} />
            {/* La accion prominente de esta pantalla: es a lo que se viene. */}
            <AddMealDialog date={date} />
          </>
        }
      >
        <DateSelector
          date={date}
          today={today}
          basePath="/nutricion"
          className="-ml-2"
        />
      </PageHeader>

      <DaySummary plan={plan} />

      {/* Consulta libre, sin alimento de partida: informa el impacto pero no
          ofrece aplicar, porque aqui no hay un item del plan al que aplicarlo.
          Para eso esta el mismo panel colgado de cada alimento en Hoy. */}
      <SwapQuestionPanel />

      {plan.meals.length > 0 ? (
        <Section variant="plain" title={messages.nutrition.todaysMealsTitle}>
          <p className="text-muted-foreground mb-4 text-sm text-pretty">
            {messages.nutrition.todaysMealsNote}{" "}
            <Link href="/" className="underline underline-offset-4">
              {messages.nutrition.todaysMealsNoteLink}
            </Link>
            .
          </p>
          {/* Lista, no rejilla: las comidas del dia son una secuencia. */}
          <div className="flex flex-col gap-4">
            {plan.meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </Section>
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
