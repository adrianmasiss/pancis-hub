import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDietForm } from "@/features/nutrition/components/upload-diet-form";
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

  return (
    <>
      <PageHeader title={t.pageTitle} description={t.pageDescription} />
      <div className="max-w-3xl py-6">
        <UploadDietForm />
      </div>
    </>
  );
}
