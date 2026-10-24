import "@/features/nutrition/components/nutrition-workspace.css";
import "@/features/nutrition/components/compare.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewHeader } from "@/components/shared/view-header";
import { NutritionNav } from "@/features/nutrition/components/nutrition-nav";
import { CompareTool } from "@/features/nutrition/components/compare-tool";
import { getComparisonMeals } from "@/features/nutrition/compare-queries";
import { resolveNutritionDate } from "@/features/nutrition/lib/day-overview";
import { todayInTimezone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { isPhone } from "@/lib/device";

export const metadata: Metadata = { title: "Comparar comidas" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; comida?: string; origen?: string }>;
}) {
  const params = await searchParams;
  // En telefono, Comparar es una pestaña de Nutricion.
  if (await isPhone()) redirect("/nutricion?vista=comparar");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const date = resolveNutritionDate(
    params.fecha,
    todayInTimezone(profile?.timezone ?? "America/Costa_Rica"),
  );
  const data = await getComparisonMeals(
    user.id,
    date,
    params.origen === "plan" ? "plan" : "day",
  );
  const initialMealId = data.dietMeals.some((meal) => meal.id === params.comida)
    ? params.comida
    : undefined;
  return (
    <div className="nutrition-workspace">
      <ViewHeader
        title="Nutrición"
        description="Compara comidas completas o crea una alternativa con los alimentos que prefieras."
      />
      <NutritionNav active="compare" date={date} />
      <div className="nutrition-comparison-intro">
        <h2>Antes de cambiar, compara</h2>
        <p>
          Revisa calorías, cantidades y macros. Esta herramienta no modifica tu
          plan. Para aplicar un cambio, usa Sustituir en la comida
          correspondiente.
        </p>
        <small>
          {params.origen === "plan"
            ? "Plan habitual"
            : `Plan y registros del ${date}`}
        </small>
      </div>
      <CompareTool
        key={`${date}-${params.origen}-${initialMealId}`}
        {...data}
        initialMealId={initialMealId}
      />
    </div>
  );
}
