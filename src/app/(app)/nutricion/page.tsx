import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Utensils } from "lucide-react";
import { DateSelector } from "@/components/shared/date-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { NutritionEditorialImage } from "@/components/shared/nutrition-editorial-image";
import { AddMealDialog } from "@/features/nutrition/components/add-meal-dialog";
import { DaySummary } from "@/features/nutrition/components/day-summary";
import { MealCard } from "@/features/nutrition/components/meal-card";
import { Section } from "@/components/shared/section";
import { DayHeroCard } from "@/features/nutrition/components/day-hero-card";
import { NutritionActionsMenu } from "@/features/nutrition/components/nutrition-actions-menu";
import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { PlanMealCard } from "@/features/nutrition/components/plan-meal-card";
import { MealRail } from "@/features/nutrition/components/meal-rail";
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

  const [plan, dietPlan] = await Promise.all([
    getDayPlan(user.id, date),
    getDietPlanForDate(user.id, date),
  ]);

  // La comida que toca: la primera del plan sin registrar. Es la unica que
  // abre sola — al resto no hay razon para hacerle sitio hasta que se pidan.
  const nextPendingId =
    dietPlan?.meals.find((meal) => !meal.loggedToday)?.id ?? null;
  const mealCount = dietPlan?.meals.length ?? 0;
  const loggedCount =
    dietPlan?.meals.filter((meal) => meal.loggedToday).length ?? 0;
  const pendingMeals =
    dietPlan?.meals.filter((meal) => !meal.loggedToday) ?? [];
  const nextPendingName =
    pendingMeals.length === 1 ? (pendingMeals[0]?.name ?? null) : null;
  // La energia del PLAN, no la meta: el peso de cada comida se mide contra lo
  // que el plan suma, que casi nunca coincide al kcal con nutrition_targets.
  const planCalories =
    dietPlan?.meals.reduce((sum, meal) => sum + meal.totals.calories, 0) ?? 0;
  const selectedDate = new Date(`${date}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("es-419", {
    weekday: "long",
    timeZone: "UTC",
  }).format(selectedDate);
  const dayNumber = selectedDate.getUTCDate();

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
        className="border-hairline h-[118px] border-b lg:mb-0 lg:h-[112px]"
        actions={
          <>
            <span className="lg:hidden">
              <NutritionActionsMenu date={date} compact />
            </span>
            <span className="hidden items-center gap-2 lg:inline-flex">
              <AddMealDialog date={date} />
              <NutritionActionsMenu date={date} compact />
            </span>
          </>
        }
      />

      {/*
        El plan del dia, como lo dibuja la maqueta (nodo 11:2): totales
        arriba, y debajo las comidas plegables con su circulo de estado y la
        capsula "Cambiar" en cada alimento.

        Es lo que esta pantalla muestra ahora. Antes mostraba solo lo
        registrado, que responde "¿que comi?" — pero al entrar a Nutricion la
        pregunta es "¿que me toca?", y esa solo la contesta el plan.
      */}
      {/*
        El heroe del dia abre la pantalla, con plan o sin el. El handoff
        invierte la jerarquia que habia aqui: la respuesta —cuanto llevas y
        cuanto falta— vivia en una tarjeta lateral, y al entrar a Nutricion la
        primera pregunta es justo esa. El plan queda debajo, que es donde se
        actua.
      */}
      {plan.targets ? (
        <div className="pt-5 lg:pt-6">
          <DayHeroCard
            plan={plan}
            mealCount={mealCount}
            loggedCount={loggedCount}
            nextPendingName={nextPendingName}
          />
        </div>
      ) : null}

      {dietPlan ? (
        <>
          <div className="grid items-start gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <section className="border-hairline order-2 border lg:order-1">
              <header className="border-hairline relative grid gap-4 border-b px-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:px-6">
                <div>
                  <p className="text-primary text-[10px] font-semibold tracking-[0.13em] uppercase">
                    Plan del día
                  </p>
                  <h2 className="mt-1 text-[20px] font-medium tracking-[-0.03em]">
                    {weekday.charAt(0).toLocaleUpperCase("es-419") +
                      weekday.slice(1)}
                  </h2>
                </div>
                <DateSelector
                  date={date}
                  today={today}
                  basePath="/nutricion"
                  className="sm:mr-20"
                />
                <div className="text-muted-foreground absolute top-5 right-6 hidden text-right lg:block">
                  <span className="block text-[9px] tracking-[0.14em] uppercase">
                    Día
                  </span>
                  <span className="num block text-[38px] leading-none font-light">
                    {dayNumber}
                  </span>
                </div>
              </header>
              <div className="px-4 py-5 lg:px-6">
                <MealRail meals={dietPlan.meals}>
                  {dietPlan.meals.map((meal) => (
                    <PlanMealCard
                      key={meal.id}
                      meal={meal}
                      date={date}
                      defaultOpen={meal.id === nextPendingId}
                      dayCalories={planCalories}
                      dayTotals={plan.totals}
                      dayTargets={plan.targets}
                    />
                  ))}
                </MealRail>
                <div className="pt-2 pl-[39px] sm:pl-[51px]">
                  <AddMealDialog date={date} trigger="plan-row" />
                </div>
              </div>
            </section>
            <aside className="order-1 flex flex-col gap-4 lg:sticky lg:top-6 lg:order-2">
              {/* Sin totales aqui: los dice el heroe, arriba. Repetirlos era
                  la misma cifra dos veces en la misma pantalla. */}
              {plan.targets ? null : <DaySummary plan={plan} />}
              <section className="border-hairline hidden border px-5 py-4 lg:block">
                <p className="text-primary text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Enfoque del día
                </p>
                <p className="text-muted-foreground mt-2 text-[12px] leading-relaxed">
                  Mantén el plan visible y registra cada comida cuando la
                  completes. Los totales se actualizan en el momento.
                </p>
              </section>
              <NutritionEditorialImage
                className="hidden h-[168px] rounded-sm lg:block"
                imageClassName="object-[42%_60%]"
              />
            </aside>
          </div>
        </>
      ) : plan.targets ? (
        <div className="pt-6">
          <EmptyState
            icon={Utensils}
            title={messages.nutrition.dayHero.noPlanTitle}
            description={messages.nutrition.dayHero.noPlanBody}
            action={<NutritionActionsMenu date={date} />}
          />
        </div>
      ) : (
        <DaySummary plan={plan} />
      )}

      {/*
        Lo que la persona REGISTRO. `getDayPlan` ya traia `plan.meals` y la
        pantalla las tiraba: se consultaban y no se rendian en ninguna parte,
        asi que "Agregar comida" creaba algo invisible y no habia forma de
        anadirle alimentos ni de corregirla. `MealCard` y `FoodPicker`
        existian sin montarse.

        Va DEBAJO del plan a proposito: al entrar la pregunta es "que me
        toca", y "que comi" es la segunda.
      */}
      <div className="pt-6">
        <Section
          title={messages.nutrition.loggedTitle}
          description={messages.nutrition.loggedDescription}
          variant="plain"
        >
          {plan.meals.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {plan.meals.map((meal) => (
                <li key={meal.id}>
                  <MealCard
                    meal={meal}
                    dayTotals={plan.totals}
                    dayTargets={plan.targets}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-[15px] leading-[1.65]">
              {messages.nutrition.loggedEmpty}
            </p>
          )}
        </Section>
      </div>
    </>
  );
}
