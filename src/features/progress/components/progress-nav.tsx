import { Camera, HeartPulse, History, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconTabs } from "@/components/ui/icon-tabs";

export type ProgressView = "resumen" | "historial" | "fotos" | "bienestar";

/**
 * Las cuatro vistas de Progreso. Va por URL y no por estado de cliente para
 * que una pestaña concreta se pueda compartir, recargar y volver atrás con el
 * botón del navegador — que es lo que la gente espera de algo que se ve como
 * una navegación.
 *
 * Mismas pestañas de disco que Nutrición y Entrenamiento (`IconTabs`): las
 * tres secciones se navegan igual.
 */
const VISTAS: {
  slug: ProgressView;
  rotulo: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    slug: "resumen",
    rotulo: "Resumen",
    href: "/progreso",
    icon: LayoutDashboard,
  },
  {
    slug: "historial",
    rotulo: "Historial",
    href: "/progreso?vista=historial",
    icon: History,
  },
  {
    slug: "fotos",
    rotulo: "Fotos",
    href: "/progreso?vista=fotos",
    icon: Camera,
  },
  {
    slug: "bienestar",
    rotulo: "Bienestar",
    href: "/progreso?vista=bienestar",
    icon: HeartPulse,
  },
];

export function ProgressNav({ active }: { active: ProgressView }) {
  return (
    <IconTabs
      label="Vistas de progreso"
      className="progress-nav-tabs"
      items={VISTAS.map(({ slug, rotulo, href, icon }) => ({
        href,
        label: rotulo,
        icon,
        active: active === slug,
      }))}
    />
  );
}
