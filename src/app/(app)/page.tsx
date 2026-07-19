import { Home } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { messages } from "@/i18n/es-419";

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      title={messages.nav.home}
      emptyTitle={messages.emptyStates.dashboard.title}
      emptyDescription={messages.emptyStates.dashboard.description}
      icon={Home}
    />
  );
}
