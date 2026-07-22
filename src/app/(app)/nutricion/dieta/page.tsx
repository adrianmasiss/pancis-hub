import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DietVersionsSection } from "@/features/nutrition/components/diet-versions-section";
import { UploadDietForm } from "@/features/nutrition/components/upload-diet-form";
import { listDietVersions } from "@/features/nutrition/version-actions";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.aiDiet;

export const metadata: Metadata = { title: t.pageTitle };

// El analisis con Gemini (imagen/PDF) puede tardar mas que el limite por
// defecto de una Server Action en Vercel.
export const maxDuration = 60;

export default async function UploadDietPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Las versiones son de la dieta activa: es la que se edita y la que
  // conviene poder restaurar.
  const { data: activeTemplate } = await supabase
    .from("diet_templates")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const versions = activeTemplate
    ? await listDietVersions(activeTemplate.id)
    : null;

  return (
    <>
      <PageHeader title={t.pageTitle} description={t.pageDescription} />
      <div className="max-w-3xl space-y-6 py-6">
        <UploadDietForm />
        {activeTemplate && versions ? (
          <DietVersionsSection
            templateId={activeTemplate.id}
            initial={versions}
          />
        ) : null}
      </div>
    </>
  );
}
