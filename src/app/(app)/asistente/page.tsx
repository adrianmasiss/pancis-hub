import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AssistantChat } from "@/features/assistant/components/assistant-chat";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.assistant;

export const metadata: Metadata = { title: t.title };

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />
      <AssistantChat />
    </>
  );
}
