import Link from "next/link";
import { ListChecks } from "lucide-react";
import { ScreenHeader } from "@/mobile/shell/screen-header";
import { ModuleTabs } from "@/mobile/shell/module-tabs";
import { PreloadModel } from "@/mobile/ui/preload-model";

const TABS = [
  { id: "hoy", label: "Hoy", href: "/entrenamiento?vista=hoy" },
  { id: "rutinas", label: "Rutinas", href: "/entrenamiento?vista=rutinas" },
  {
    id: "historial",
    label: "Historial",
    href: "/entrenamiento?vista=historial",
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    href: "/entrenamiento?vista=biblioteca",
  },
] as const;

/** Encabezado y pestañas de Entrenar, comunes a sus cuatro secciones. */
export function TrainingTabs({
  active,
  title,
  subtitle,
  children,
}: {
  active: (typeof TABS)[number]["id"];
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="m-screen">
      <PreloadModel />
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link
            href="/entrenamiento?vista=rutinas"
            aria-label="Cambiar de rutina"
            className="m-icon-btn m-press"
          >
            <ListChecks size={20} strokeWidth={2} aria-hidden="true" />
          </Link>
        }
      />
      <ModuleTabs label="Secciones de Entrenar" tabs={TABS} active={active} />
      {children}
    </div>
  );
}
