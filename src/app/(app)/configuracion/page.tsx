import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.settings };

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.settings}
      emptyTitle={messages.emptyStates.settings.title}
      emptyDescription={messages.emptyStates.settings.description}
      icon={Settings}
    />
  );
}
