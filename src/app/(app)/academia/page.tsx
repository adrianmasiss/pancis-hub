import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.academy };

export default function AcademyPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.academy}
      emptyTitle={messages.emptyStates.academy.title}
      emptyDescription={messages.emptyStates.academy.description}
      icon={GraduationCap}
    />
  );
}
