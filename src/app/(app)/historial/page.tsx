import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { History as HistoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getChangeHistory, type ChangeEntry } from "@/features/history/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.history;

export const metadata: Metadata = { title: t.title };

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-419", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Los valores se guardan como jsonb con claves ya legibles en espanol. */
function formatValues(values: Record<string, unknown> | null): string {
  if (!values) return "—";
  return Object.entries(values)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
    .join(" · ");
}

function ChangeRow({ entry }: { entry: ChangeEntry }) {
  return (
    <li className="space-y-1.5 rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          {t.actions[entry.action] ?? entry.action}
        </span>
        <Badge variant="outline" className="font-normal">
          {t.origins[entry.origin]}
        </Badge>
        <span className="text-muted-foreground ml-auto text-xs">
          {formatDateTime(entry.createdAt)}
        </span>
      </div>

      <p className="text-muted-foreground text-xs">
        <span className="font-medium">{t.before}:</span>{" "}
        {formatValues(entry.previousValues)}
      </p>
      <p className="text-muted-foreground text-xs">
        <span className="font-medium">{t.after}:</span>{" "}
        {formatValues(entry.newValues)}
      </p>
      {entry.reason ? (
        <p className="text-muted-foreground text-xs">
          <span className="font-medium">{t.reason}:</span> {entry.reason}
        </p>
      ) : null}
    </li>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getChangeHistory(user.id);

  return (
    <>
      <PageHeader title={t.title} description={t.description} />

      {entries.length > 0 ? (
        <>
          <ul className="space-y-2">
            {entries.map((entry) => (
              <ChangeRow key={entry.id} entry={entry} />
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">{t.retentionNote}</p>
        </>
      ) : (
        <EmptyState title={t.title} description={t.empty} icon={HistoryIcon} />
      )}
    </>
  );
}
