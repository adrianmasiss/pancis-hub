import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.progress };

export default function ProgressPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.progress}
      emptyTitle={messages.emptyStates.progress.title}
      emptyDescription={messages.emptyStates.progress.description}
      icon={TrendingUp}
    />
  );
}
