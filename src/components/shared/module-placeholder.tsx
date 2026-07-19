import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

type ModulePlaceholderProps = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
};

/**
 * Pagina temporal de modulo aun no implementado. Se reemplaza por el
 * modulo real en la Fase D; no debe contener botones sin funcionalidad.
 */
export function ModulePlaceholder({
  title,
  emptyTitle,
  emptyDescription,
  icon,
}: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={icon}
      />
    </>
  );
}
