import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.checkins };

export default function CheckinsPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.checkins}
      emptyTitle={messages.emptyStates.checkins.title}
      emptyDescription={messages.emptyStates.checkins.description}
      icon={NotebookPen}
    />
  );
}
