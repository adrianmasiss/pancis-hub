import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdherenceCard } from "@/features/dashboard/components/adherence-card";
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
import { TrainingCard } from "@/features/dashboard/components/training-card";
import { DietChecklist } from "@/features/dashboard/components/diet-checklist";
import { NoTargetsCard } from "@/features/dashboard/components/no-targets-card";
import { buildTodayNutrition } from "@/features/dashboard/lib/today";
import type { ToleranceKey } from "@/features/nutrition/lib/tolerances";
import { getDashboardData } from "@/features/dashboard/queries";
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

  if (!user) {
    redirect("/login");
  }

  const [data, recalculation] = await Promise.all([
    getDashboardData(user.id),
    getTargetRecalculation(user.id),
  ]);

  /*
    Orden de la maqueta (nodo 6:2), de arriba abajo: saludo, la cifra que
    falta, los macros, que toca comer ahora, y el gesto del dia.

    Cambia respecto de la version anterior en dos cosas que importan. La cifra
    deja de compartir tarjeta con los macros —era lo unico que habia que mirar
    y competia con cuatro filas— y el boton baja al final, al alcance del
    pulgar, en vez de partir la tarjeta por la mitad.
  */
  return (
    <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-[18px]">
      <TodayHeader data={data} />

      {data.targets ? (
        <TodayBlocks data={data} targetsOutdated={recalculation !== null} />
      ) : (
        <NoTargetsCard />
      )}

      {/*
        Fuera de la maqueta, y a proposito: el frame de Hoy ocupa exactamente
        una pantalla y no dibuja lo que hay al seguir bajando. Estos tres se
        quedan porque quitarlos seria perder funcion, no ruido: la lista del
        plan es la via rapida para registrar una comida, y entrenamiento y
        adherencia son las otras dos preguntas del dia.
      */}
      {data.dietTemplate ? (
        <DietChecklist template={data.dietTemplate} today={data.today} />
      ) : null}
      <TrainingCard data={data} />
      <AdherenceCard data={data} />
    </div>
  );
}

function TodayBlocks({
  data,
  targetsOutdated,
}: {
  data: Awaited<ReturnType<typeof getDashboardData>>;
  targetsOutdated: boolean;
}) {
  const { targets, consumed, plannedTotals, tolerances } = data;
  const today = buildTodayNutrition({
    target: targets!,
    planned: plannedTotals,
    consumed,
    tolerances,
  });

  /**
   * UN aviso, el mas urgente. Por orden de consecuencias: pasarse ya ocurrio,
   * el plan que no llega se corrige hoy, y unos objetivos viejos afectan a
   * todo lo demas. La maqueta no dibuja ninguno, pero callar que las cifras
   * caducaron seria mentir con el diseno.
   */
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

  return (
    <>
      <TodayRemainingCard
        today={today}
        plannedCalories={
          plannedTotals ? Math.round(plannedTotals.calories) : null
        }
        notice={notice}
      />

      <TodayMacrosCard today={today} />

      <NextMealRow meal={nextPendingMeal(data.dietTemplate)} />

      {/* El gesto del dia, a ancho completo y al final: es lo ultimo que se
          lee y lo primero que se toca. */}
      <Button asChild variant="brand" size="xl" className="w-full">
        <Link href="/nutricion">{t.logMeal}</Link>
      </Button>
    </>
  );
}
