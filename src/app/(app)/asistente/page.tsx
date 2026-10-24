import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AssistantChat } from "@/features/assistant/components/assistant-chat";
import { createClient } from "@/lib/supabase/server";
import { isPhone } from "@/lib/device";
import { todayInTimezone } from "@/lib/dates";
import { CopilotMobile } from "@/mobile/screens/copilot/copilot-mobile";
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

  // Telefono: su propia capa visual, con la misma accion.
  if (await isPhone()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle();
    return (
      <CopilotMobile
        initialMessage={q?.slice(0, 500)}
        today={todayInTimezone(profile?.timezone ?? "America/Costa_Rica")}
      />
    );
  }

  return <AssistantChat initialMessage={q?.slice(0, 500)} />;
}
