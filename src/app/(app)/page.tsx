import { redirect } from "next/navigation";
import { AdherenceCard } from "@/features/dashboard/components/adherence-card";
import { DietChecklist } from "@/features/dashboard/components/diet-checklist";
import { HeroBanner } from "@/features/dashboard/components/hero-banner";
import { NutritionCard } from "@/features/dashboard/components/nutrition-card";
import { TrainingCard } from "@/features/dashboard/components/training-card";
import { getDashboardData } from "@/features/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(user.id);

  return (
    /*
      Estructura del handoff v2: columna principal fluida mas riel derecho de
      320px, gap 20px, alineados arriba. Por debajo de xl el riel se apila
      bajo el contenido; el handoff es un diseno de escritorio, pero la app se
      usa tambien en telefono y ahi una segunda columna no cabe.
    */
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-5">
        <HeroBanner data={data} />

        {data.dietTemplate ? (
          <DietChecklist template={data.dietTemplate} today={data.today} />
        ) : null}

        <TrainingCard data={data} />
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <NutritionCard data={data} />
        <AdherenceCard data={data} />
      </aside>
    </div>
  );
}
