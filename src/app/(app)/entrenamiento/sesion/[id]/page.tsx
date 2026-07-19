import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SessionView } from "@/features/training/components/session-view";
import { getSessionDetail } from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export const metadata: Metadata = { title: t.sessionTitle };

export default async function SessionPage({
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
  const session = await getSessionDetail(user.id, id);
  if (!session) notFound();
  if (session.completedAt) redirect("/entrenamiento");

  const title = session.planName
    ? `${session.planName}${session.dayName ? ` — ${session.dayName}` : ""}`
    : t.freeSession;

  return (
    <>
      <PageHeader title={title} description={t.sessionTitle} />
      <SessionView session={session} />
    </>
  );
}
