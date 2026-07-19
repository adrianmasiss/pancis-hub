import type { Metadata } from "next";
import { Utensils } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.nutrition };

export default function NutritionPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.nutrition}
      emptyTitle={messages.emptyStates.nutrition.title}
      emptyDescription={messages.emptyStates.nutrition.description}
      icon={Utensils}
    />
  );
}
