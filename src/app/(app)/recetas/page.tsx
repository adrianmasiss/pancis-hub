import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.nav.recipes };

export default function RecipesPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.recipes}
      emptyTitle={messages.emptyStates.recipes.title}
      emptyDescription={messages.emptyStates.recipes.description}
      icon={ChefHat}
    />
  );
}
