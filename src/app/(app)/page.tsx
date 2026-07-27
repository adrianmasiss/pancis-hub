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
    <div className="space-y-6">
      <HeroBanner data={data} />

      {data.dietTemplate ? (
        <DietChecklist template={data.dietTemplate} today={data.today} />
      ) : null}

      <NutritionCard data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrainingCard data={data} />
        <AdherenceCard data={data} />
      </div>
    </div>
  );
}
