import {
  ChefHat,
  Dumbbell,
  GraduationCap,
  Home,
  NotebookPen,
  Settings,
  Sparkles,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { messages } from "@/i18n/es-419";

type NavLabelKey = keyof typeof messages.nav;

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  /** Etiqueta corta para la navegacion inferior movil, si difiere. */
  bottomNavLabelKey?: NavLabelKey;
  icon: LucideIcon;
  showInSidebar: boolean;
  /** Los items sin lugar en la barra inferior se muestran en el sheet "Mas". */
  showInBottomNav: boolean;
};

/**
 * Unica fuente de verdad de la navegacion (docs/05_INFORMATION_ARCHITECTURE.md).
 * Sidebar de escritorio: 9 entradas. Barra inferior movil: 4 entradas + "Mas".
 */
export const navItems: readonly NavItem[] = [
  {
    href: "/",
    labelKey: "home",
    icon: Home,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    href: "/nutricion",
    labelKey: "nutrition",
    icon: Utensils,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    href: "/recetas",
    labelKey: "recipes",
    icon: ChefHat,
    showInSidebar: true,
    showInBottomNav: false,
  },
  {
    href: "/entrenamiento",
    labelKey: "training",
    bottomNavLabelKey: "trainingShort",
    icon: Dumbbell,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    href: "/progreso",
    labelKey: "progress",
    icon: TrendingUp,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    href: "/diario",
    labelKey: "checkins",
    icon: NotebookPen,
    showInSidebar: true,
    showInBottomNav: false,
  },
  {
    href: "/academia",
    labelKey: "academy",
    icon: GraduationCap,
    showInSidebar: true,
    showInBottomNav: false,
  },
  {
    href: "/asistente",
    labelKey: "assistant",
    icon: Sparkles,
    showInSidebar: true,
    showInBottomNav: false,
  },
  {
    href: "/configuracion",
    labelKey: "settings",
    icon: Settings,
    showInSidebar: true,
    showInBottomNav: false,
  },
] as const;

export const sidebarItems = navItems.filter((item) => item.showInSidebar);
export const bottomNavItems = navItems.filter((item) => item.showInBottomNav);
export const moreSheetItems = navItems.filter((item) => !item.showInBottomNav);

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
