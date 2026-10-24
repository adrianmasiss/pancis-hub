import { ActionLink } from "@/components/ui/action";
import "@/features/nutrition/components/nutrition-workspace.css";
import "@/features/nutrition/components/meal-plan.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewHeader } from "@/components/shared/view-header";
import { DateSelector } from "@/components/shared/date-selector";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { NutritionHistory } from "@/features/nutrition/components/nutrition-history";
import { NutritionNav } from "@/features/nutrition/components/nutrition-nav";
import { NutritionWorkspace } from "@/features/nutrition/components/nutrition-workspace";
import { BrandLogo } from "@/components/shared/brand-logo";
import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { resolveNutritionDate } from "@/features/nutrition/lib/day-overview";
import { isPhone } from "@/lib/device";
import { NutritionMobile } from "@/mobile/screens/nutrition/nutrition-mobile";

export const metadata: Metadata = { title: "Nutrición" };

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    periodo?: string;
    fecha?: string;
    comida?: string;
    item?: string;
    q?: string;
    filtro?: string;
  }>;
}) {
  const params = await searchParams;
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
  const today = todayInTimezone(profile?.timezone ?? "America/Costa_Rica");
  const date = resolveNutritionDate(params.fecha, today);

  // Telefono: su propia capa visual, con los mismos datos y acciones.
  if (await isPhone()) {
    return (
      <NutritionMobile
        userId={user.id}
        today={today}
        date={date}
        timezone={profile?.timezone ?? "America/Costa_Rica"}
        params={params}
      />
    );
  }
  const active =
    params.vista === "historial"
      ? "history"
      : params.vista === "plan"
        ? "plan"
        : "day";
  const period =
    params.periodo === "30" ? 30 : params.periodo === "90" ? 90 : 7;

  if (active === "history")
    return (
      <div className="nutrition-workspace" data-view={active}>
        <ViewHeader
          title="Nutrición"
          description="Tendencias de tus registros. Los días sin registrar no se cuentan como cero."
        />
        <NutritionNav active="history" date={date} />
        <h2 className="text-xl font-semibold">Tu alimentación en el tiempo</h2>
        <NutritionHistory userId={user.id} period={period} />
      </div>
    );

  const [day, diet] = await Promise.all([
    getDayPlan(user.id, date),
    getDietPlanForDate(user.id, date, active),
  ]);
  return (
    <div className="nutrition-workspace" data-view={active}>
      <header className="nutrition-dashboard-header">
        <div className="nutrition-dashboard-brand">
          <BrandLogo variant="mark" height={34} />
          <div>
            <h1>Mi Nutrición</h1>
            <p>Tu plan diario, claro y medible</p>
          </div>
        </div>
        {/* En cabeceras estrechas se muestra el + compacto; el nombre
            accesible conserva siempre la acción completa. */}
        <ActionLink
          family="add"
          compactOnMobile
          href="/nutricion/dieta"
          aria-label="Importar dieta"
        >
          Importar dieta
        </ActionLink>
      </header>
      <NutritionNav active={active} date={date} />
      {active === "day" && diet && date !== today && (
        <p className="text-muted-foreground text-xs">
          El plan mostrado es el activo. El registro conserva lo que comiste en
          esta fecha.
        </p>
      )}
      <NutritionWorkspace
        day={day}
        diet={diet}
        mode={active}
        dateControl={
          <DateSelector date={date} today={today} basePath="/nutricion" />
        }
      />
    </div>
  );
}
