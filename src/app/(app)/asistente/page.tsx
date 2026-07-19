import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.assistant };

export default function AssistantPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.assistant}
      emptyTitle={messages.emptyStates.assistant.title}
      emptyDescription={messages.emptyStates.assistant.description}
      icon={Sparkles}
    />
  );
}
