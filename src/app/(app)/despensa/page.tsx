import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Refrigerator } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PantryAdd } from "@/features/pantry/components/pantry-add";
import { PantryList } from "@/features/pantry/components/pantry-list";
import { getPantryItems } from "@/features/pantry/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.pantry;

export const metadata: Metadata = { title: t.title };

export default async function PantryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await getPantryItems(user.id);

  return (
    <div className="space-y-6">
      <PageHeader icon={Refrigerator} title={t.title} description={t.description} />
      <PantryAdd />
      <PantryList items={items} />
    </div>
  );
}
