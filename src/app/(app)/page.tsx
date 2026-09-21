import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NutritionEditorialImage } from "@/components/shared/nutrition-editorial-image";
import {
  NextMealRow,
  nextPendingMeal,
} from "@/features/dashboard/components/next-meal-row";
import { TodayHeader } from "@/features/dashboard/components/today-header";
import { TodayMacrosCard } from "@/features/dashboard/components/today-macros-card";
import {
  TodayRemainingCard,
  type TodayNotice,
} from "@/features/dashboard/components/today-remaining-card";
import { NoTargetsCard } from "@/features/dashboard/components/no-targets-card";
import { buildTodayNutrition } from "@/features/dashboard/lib/today";
import type { ToleranceKey } from "@/features/nutrition/lib/tolerances";
import {
  getDashboardData,
  type DashboardData,
  type DietTemplateView,
} from "@/features/dashboard/queries";
import { getTargetRecalculation } from "@/features/settings/target-recalculation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.dashboard.nutrition;

const listMacros = (macros: ToleranceKey[]) =>
  macros.map((macro) => t.macroNames[macro]).join(", ");

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [data, recalculation] = await Promise.all([
    getDashboardData(user.id),
    getTargetRecalculation(user.id),
  ]);

  return (
    <div className="flex w-full flex-col">
      <TodayHeader data={data} />
      {data.targets ? (
        <TodayBlocks data={data} targetsOutdated={recalculation !== null} />
      ) : (
        <NoTargetsCard />
      )}
    </div>
  );
}

function TodayBlocks({
  data,
  targetsOutdated,
}: {
  data: DashboardData;
  targetsOutdated: boolean;
}) {
  const { targets, consumed, plannedTotals, tolerances } = data;
  const today = buildTodayNutrition({
    target: targets!,
    planned: plannedTotals,
    consumed,
    tolerances,
  });

  const notice: TodayNotice | null =
    today.exceeded.length > 0
      ? {
          text: t.consumedOver.replace("{macros}", listMacros(today.exceeded)),
          tone: "caution",
        }
      : today.planVsTarget && !today.planVsTarget.withinTolerance
        ? {
            text: t.planOutside.replace(
              "{macros}",
              listMacros(today.planVsTarget.exceeded),
            ),
            tone: "caution",
          }
        : targetsOutdated
          ? {
              text: t.outdated,
              tone: "caution",
              link: { href: "/configuracion", label: t.outdatedLink },
            }
          : today.nothingLogged
            ? { text: t.dayNotStarted, tone: "muted" }
            : null;

  const nextMeal = nextPendingMeal(data.dietTemplate);

  return (
    <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-5">
        <div className="border-hairline grid items-stretch gap-0 lg:grid-cols-[minmax(280px,0.86fr)_minmax(0,1.14fr)] lg:border-y">
          <TodayRemainingCard
            today={today}
            plannedCalories={
              plannedTotals ? Math.round(plannedTotals.calories) : null
            }
            notice={notice}
          />
          <TodayMacrosCard today={today} />
        </div>

        <div className="lg:hidden">
          <NextMealRow meal={nextMeal} />
        </div>
        <Button
          asChild
          variant="brand"
          size="xl"
          className="w-full rounded-md lg:hidden"
        >
          <Link href="/nutricion">{t.logMeal}</Link>
        </Button>

        {data.dietTemplate ? (
          <DesktopPlanCard template={data.dietTemplate} />
        ) : null}
      </div>

      {/*
        Esto NO es una columna de escritorio. Estaba `hidden lg:flex`, asi que
        la semana, el peso y el entrenamiento de hoy desaparecian justo en el
        telefono, que es la escena principal del producto (PRODUCT.md). Ahora
        se rinden siempre: apiladas en telefono, en dos columnas en tablet, y
        como columna lateral desde 1024px.

        La fotografia si se queda en escritorio: es contexto, y en telefono el
        alto vertical se lo debe a los datos.
      */}
      <aside className="lg:border-hairline flex flex-col lg:border-l lg:pl-6">
        <NutritionEditorialImage
          className="mb-1 hidden h-[172px] rounded-sm lg:block"
          imageClassName="object-[32%_55%]"
        />
        <div className="divide-hairline md:[&>section]:border-hairline flex flex-col divide-y md:grid md:grid-cols-2 md:gap-x-6 md:divide-y-0 lg:flex lg:divide-y md:[&>section]:border-t lg:[&>section]:border-t-0">
          <DayNextMeal meal={nextMeal} />
          <DayWeek data={data} />
          <DayWeight data={data} />
          <DayTraining data={data} />
        </div>
      </aside>
    </section>
  );
}

function DayNextMeal({ meal }: { meal: ReturnType<typeof nextPendingMeal> }) {
  if (!meal) return null;
  return (
    <section className="flex min-h-[116px] flex-col py-4">
      <p className="text-primary text-[10px] font-semibold tracking-[0.12em] uppercase">
        Sigue: {meal.name}
      </p>
      <p className="mt-2 text-[13px] font-medium">{meal.foods[0]}</p>
      <p className="text-muted-foreground mt-1 truncate text-[11px]">
        {meal.foods.slice(0, 3).join(", ")} · {meal.calories} kcal
      </p>
      <Button
        asChild
        variant="link"
        size="sm"
        className="mt-auto w-fit justify-start px-0"
      >
        <Link href="/nutricion">Ver la comida</Link>
      </Button>
    </section>
  );
}

function DayWeek({ data }: { data: DashboardData }) {
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <section className="min-h-[116px] py-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Tu semana</p>
        <p className="text-primary text-[11px] font-semibold">
          {data.adherence.mealDays7} de 7
        </p>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-2">
        {data.adherence.days.map((day, index) => (
          <li key={day.date} className="flex flex-col items-center gap-1.5">
            <span
              className={`size-7 rounded-full border ${
                day.ate
                  ? "border-primary bg-primary"
                  : "bg-card-raised border-white/10"
              }`}
            />
            <span className="text-subtle-foreground text-[9px]">
              {labels[index]}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DayWeight({ data }: { data: DashboardData }) {
  const value = data.weight.last?.value;
  const delta = data.weight.weeklyChange;
  const points = data.weight.series.slice(-10);
  const values = points.map((point) => point.value);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  return (
    <section className="min-h-[126px] py-4">
      <div className="flex items-baseline justify-between">
        <p className="num text-[25px] leading-none font-semibold">
          {value ?? "—"}
          <span className="text-muted-foreground ml-1 text-[11px] font-normal">
            kg
          </span>
        </p>
        {delta !== null ? (
          <p className="text-primary text-[11px] font-semibold">
            {delta > 0 ? "+" : ""}
            {delta} kg en 7 días
          </p>
        ) : null}
      </div>
      {/* Columnas, no pildoras. Con `flex-1` + `rounded-full` y pocos puntos,
          cada barra se estiraba a media columna y la serie parecia un boton
          gigante; a 570px de ancho era lo primero que se veia de la pantalla.
          Un ancho maximo las mantiene barras con cualquier numero de puntos, y
          el radio baja al del sistema. */}
      <div className="mt-5 flex h-10 items-end gap-1.5" aria-hidden="true">
        {points.map((point, index) => {
          const height =
            max === min ? 45 : 25 + ((point.value - min) / (max - min)) * 55;
          return (
            <span
              key={`${point.date}-${index}`}
              className="bg-primary max-w-[14px] min-w-0 flex-1 rounded-[3px]"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    </section>
  );
}

function DayTraining({ data }: { data: DashboardData }) {
  return (
    <section className="flex min-h-[194px] flex-col py-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Entrenamiento de hoy</p>
        {data.training.estimatedMinutes ? (
          <p className="text-subtle-foreground text-[10px]">
            ~{data.training.estimatedMinutes} min
          </p>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-[11px]">
        {data.training.activePlanName ?? "Sin rutina activa"}
        {data.training.nextDayName ? ` · ${data.training.nextDayName}` : ""}
      </p>
      <ul className="mt-4 flex flex-col gap-3 text-[11px]">
        {data.training.mainExercises.slice(0, 3).map((exercise) => (
          <li
            key={exercise}
            className="flex items-center justify-between gap-3"
          >
            <span className="truncate">{exercise}</span>
            <span className="text-subtle-foreground">3×8</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        variant="link"
        size="sm"
        className="mt-auto w-fit justify-start px-0"
      >
        <Link href="/entrenamiento">
          <Play className="size-3" aria-hidden="true" />
          Ir a entrenar
        </Link>
      </Button>
    </section>
  );
}

function DesktopPlanCard({ template }: { template: DietTemplateView }) {
  return (
    <section className="border-hairline hidden min-h-[270px] border-y py-5 lg:block">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">Plan del día</h2>
        <p className="text-subtle-foreground text-[10px]">
          {template.meals.filter((meal) => meal.loggedToday).length} de{" "}
          {template.meals.length} comidas
        </p>
      </div>
      <ul className="border-hairline mt-3 border-t">
        {template.meals.slice(0, 4).map((meal, index) => (
          <li
            key={meal.id}
            className="border-hairline grid min-h-16 grid-cols-[56px_20px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b"
          >
            <span className="text-subtle-foreground num text-[11px]">
              {["07:00", "12:30", "16:30", "20:00"][index] ?? "—"}
            </span>
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                meal.loggedToday
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/20"
              }`}
            >
              {meal.loggedToday ? (
                <Check className="size-2.5" strokeWidth={3} />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold">
                {meal.name || meal.mealType}
              </span>
              <span className="text-subtle-foreground block truncate text-[10px]">
                {meal.items
                  .slice(0, 3)
                  .map((item) => item.foodName)
                  .join(", ")}
              </span>
            </span>
            <span className="text-muted-foreground num text-[11px]">
              {Math.round(meal.totals.calories)} kcal
            </span>
            {!meal.loggedToday ? (
              <Link
                href="/nutricion"
                className="text-primary flex h-7 items-center gap-1 text-[11px] font-medium"
              >
                Abrir <ChevronRight className="size-3" />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
