import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.training };

export default function TrainingPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.training}
      emptyTitle={messages.emptyStates.training.title}
      emptyDescription={messages.emptyStates.training.description}
      icon={Dumbbell}
    />
  );
}
