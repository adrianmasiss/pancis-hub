import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AssistantChat } from "@/features/assistant/components/assistant-chat";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.assistant;

export const metadata: Metadata = { title: t.title };

// Gemini + consultas de contexto pueden tardar mas que el limite por
// defecto de una Server Action en Vercel.
export const maxDuration = 30;

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Los accesos contextuales llegan con la pregunta ya redactada.
  const { q } = await searchParams;

  return (
    <>
      <PageHeader icon={Sparkles} title={t.title} description={t.subtitle} />
      <AssistantChat initialMessage={q?.slice(0, 500)} />
    </>
  );
}
