import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { AddDayButton } from "@/features/training/components/add-day-button";
import { PlanDayCard } from "@/features/training/components/plan-day-card";
import { RoutineAnalysisSection } from "@/features/training/components/routine-analysis-section";
import {
  getPlanDetail,
  getRoutineAnalysis,
} from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export const metadata: Metadata = { title: t.editPlan };

export default async function PlanEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [plan, analysis] = await Promise.all([
    getPlanDetail(user.id, id),
    getRoutineAnalysis(user.id, id),
  ]);
  if (!plan) notFound();

  return (
    <>
      <PageHeader
        title={plan.name}
        description={plan.objective ?? undefined}
        actions={
          <>
            {plan.active ? <Badge>{t.activeBadge}</Badge> : null}
            <Button asChild variant="ghost" size="sm">
              <Link href="/entrenamiento">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t.title}
              </Link>
            </Button>
          </>
        }
      />
      <div className="space-y-4">
        {plan.days.map((day) => (
          <PlanDayCard key={day.id} day={day} />
        ))}
        <AddDayButton planId={plan.id} />
        {analysis ? <RoutineAnalysisSection analysis={analysis} /> : null}
      </div>
    </>
  );
}
