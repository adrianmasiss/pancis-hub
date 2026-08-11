import { redirect } from "next/navigation";
import { AdherenceCard } from "@/features/dashboard/components/adherence-card";
import { DietChecklist } from "@/features/dashboard/components/diet-checklist";
import { TodayHeader } from "@/features/dashboard/components/today-header";
import { TodayNutritionCard } from "@/features/dashboard/components/today-nutrition-card";
import { TrainingCard } from "@/features/dashboard/components/training-card";
import { getDashboardData } from "@/features/dashboard/queries";
import { getTargetRecalculation } from "@/features/settings/target-recalculation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    /*
      Estructura del handoff v2: columna principal fluida mas riel derecho de
      320px, gap 20px, alineados arriba. Por debajo de xl el riel se apila
      bajo el contenido; el handoff es un diseno de escritorio, pero la app se
      usa tambien en telefono y ahi una segunda columna no cabe.

      La nutricion subio del riel a la columna principal al convertirse en la
      vista Hoy: sus cuatro columnas (objetivo, plan, llevas, faltan) no caben
      en 320px, y es lo primero que se viene a mirar.
    */
    /*
      Una sola columna, tambien en escritorio.
      El riel derecho de 320px dejaba casi mil pixeles de vacio bajo la unica
      tarjeta que vivia ahi, y eso no se lee como aire sino como pagina a
      medio hacer. La adherencia baja al flujo, que ademas es el orden en que
      importa: que me falta hoy, que como, que entreno, como voy.
    */
    <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-6">
      <TodayHeader data={data} />

      {/* La respuesta del dia, arriba del pliegue y sin nada delante. */}
      <TodayNutritionCard
        data={data}
        targetsOutdated={recalculation !== null}
      />

      {data.dietTemplate ? (
        <DietChecklist template={data.dietTemplate} today={data.today} />
      ) : null}

      <TrainingCard data={data} />
      <AdherenceCard data={data} />
    </div>
  );
}
