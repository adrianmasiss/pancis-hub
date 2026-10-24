import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { ScreenHeader } from "@/mobile/shell/screen-header";
import { ModuleTabs } from "@/mobile/shell/module-tabs";

const TABS = [
  { id: "hoy", label: "Hoy", href: "/nutricion" },
  { id: "comparar", label: "Comparar", href: "/nutricion?vista=comparar" },
  {
    id: "biblioteca",
    label: "Biblioteca",
    href: "/nutricion?vista=biblioteca",
  },
  { id: "fuera", label: "Comer fuera", href: "/nutricion?vista=fuera" },
  { id: "historial", label: "Historial", href: "/nutricion?vista=historial" },
] as const;

/** Encabezado y pestañas de Nutricion, comunes a sus cinco secciones. */
export function NutritionTabs({
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
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        actions={
          active === "hoy" ? (
            <Link
              href="/nutricion?vista=historial"
              aria-label="Historial"
              className="m-icon-btn m-press"
            >
              <CalendarDays size={20} strokeWidth={2} aria-hidden="true" />
            </Link>
          ) : null
        }
      />
      <ModuleTabs label="Secciones de Nutrición" tabs={TABS} active={active} />
      {children}
    </div>
  );
}
