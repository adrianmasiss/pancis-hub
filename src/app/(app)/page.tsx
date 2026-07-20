import { redirect } from "next/navigation";
import { AdherenceCard } from "@/features/dashboard/components/adherence-card";
import { CheckinCard } from "@/features/dashboard/components/checkin-card";
import { NutritionCard } from "@/features/dashboard/components/nutrition-card";
import { ProgressCard } from "@/features/dashboard/components/progress-card";
import { SummarySection } from "@/features/dashboard/components/summary-section";
import { TrainingCard } from "@/features/dashboard/components/training-card";
import { getDashboardData } from "@/features/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

import { DietChecklist } from "@/features/dashboard/components/diet-checklist";

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
      <SummarySection data={data} />
      
      {data.dietTemplate && (
        <DietChecklist template={data.dietTemplate} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <NutritionCard data={data} />
        <TrainingCard data={data} />
      </div>
      <ProgressCard data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CheckinCard data={data} />
        <AdherenceCard data={data} />
      </div>
    </div>
  );
}
