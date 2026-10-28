import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewHeader } from "@/components/shared/view-header";
import { AddDayButton } from "@/features/training/components/add-day-button";
import { PlanDayCard } from "@/features/training/components/plan-day-card";
import { PlanVersionsSection } from "@/features/training/components/plan-versions-section";
import { RoutineAnalysisSection } from "@/features/training/components/routine-analysis-section";
import { listPlanVersions } from "@/features/training/version-actions";
import { getPlanDetail, getRoutineAnalysis } from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { OBJETIVOS } from "@/features/training/lib/routine-generation";
import { AiNotice } from "@/features/training/components/ai-notice";
import "@/features/training/components/generate-routine.css";
import { messages } from "@/i18n/es-419";
import { isPhone } from "@/lib/device";
import { RoutineEditorMobile } from "@/mobile/screens/training/routine-editor";

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

  // Telefono: editor propio. Sin la fecha de hoy, el plan llega tal cual
  // esta guardado (sin los cambios de «solo hoy»).
  if (await isPhone()) {
    const base = await getPlanDetail(user.id, id, "1970-01-01");
    if (!base) notFound();
    const ids = base.days.flatMap((d) => d.exercises.map((e) => e.exerciseId));
    const { data: fotos } = ids.length
      ? await supabase
          .from("exercise_catalog")
          .select("id, image_url")
          .in("id", [...new Set(ids)])
      : { data: [] };
    const images = Object.fromEntries(
      (fotos ?? []).flatMap((f) => (f.image_url ? [[f.id, f.image_url]] : [])),
    );
    return <RoutineEditorMobile plan={base} images={images} />;
  }

  const [plan, analysis, versions] = await Promise.all([
    getPlanDetail(user.id, id),
    getRoutineAnalysis(user.id, id),
    listPlanVersions(id),
  ]);
  if (!plan) notFound();

  return (
    <>
      <ViewHeader
        title={plan.name}
        description={
          plan.objective
            ? (OBJETIVOS.find((o) => o.id === plan.objective)?.label ??
              plan.objective)
            : undefined
        }
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
        {plan.origin === "ia" && <AiNotice />}
        {plan.days.map((day) => (
          <PlanDayCard key={day.id} day={day} />
        ))}
        <AddDayButton planId={plan.id} />
        {analysis ? <RoutineAnalysisSection analysis={analysis} /> : null}
        <PlanVersionsSection planId={id} initial={versions} />
      </div>
    </>
  );
}
