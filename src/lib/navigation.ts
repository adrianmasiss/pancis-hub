import {
  ChefHat,
  Dumbbell,
  GraduationCap,
  // "History" choca con la interfaz global History del DOM.
  History as HistoryIcon,
  Home,
  Refrigerator,
  Settings,
  Sparkles,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { messages } from "@/i18n/es-419";

export type NavLabelKey = {
  [K in keyof typeof messages.nav]: (typeof messages.nav)[K] extends string
    ? K
    : never;
}[keyof typeof messages.nav];
type NavSection = "principal" | "nutricion" | "entrenamiento" | "aprender";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  /** Etiqueta corta para la navegacion inferior movil, si difiere. */
  bottomNavLabelKey?: NavLabelKey;
  icon: LucideIcon;
  showInSidebar: boolean;
  /** Los items sin lugar en la barra inferior se muestran en el sheet "Mas". */
  showInBottomNav: boolean;
  /** Grupo visual en el sidebar/hoja "Mas". Configuracion se ancla aparte. */
  section: NavSection;
};

/**
 * Unica fuente de verdad de la navegacion (docs/05_INFORMATION_ARCHITECTURE.md).
 * Sidebar de escritorio: 9 entradas agrupadas por seccion + Configuracion
 * anclada abajo. Barra inferior movil: 4 entradas + "Mas".
 */
export const navItems: readonly NavItem[] = [
  {
    href: "/",
    labelKey: "home",
    icon: Home,
    showInSidebar: true,
    showInBottomNav: true,
    section: "principal",
  },
  {
    href: "/nutricion",
    labelKey: "nutrition",
    icon: Utensils,
    showInSidebar: true,
    showInBottomNav: true,
    section: "nutricion",
  },
  {
    href: "/recetas",
    labelKey: "recipes",
    icon: ChefHat,
    showInSidebar: true,
    showInBottomNav: false,
    section: "nutricion",
  },
  {
    href: "/despensa",
    labelKey: "pantry",
    icon: Refrigerator,
    showInSidebar: true,
    showInBottomNav: false,
    section: "nutricion",
  },
  {
    href: "/entrenamiento",
    labelKey: "training",
    bottomNavLabelKey: "trainingShort",
    icon: Dumbbell,
    showInSidebar: true,
    showInBottomNav: true,
    section: "entrenamiento",
  },
  {
    href: "/progreso",
    labelKey: "progress",
    icon: TrendingUp,
    showInSidebar: true,
    showInBottomNav: true,
    section: "entrenamiento",
  },
  {
    href: "/historial",
    labelKey: "history",
    icon: HistoryIcon,
    showInSidebar: true,
    showInBottomNav: false,
    section: "principal",
  },
  {
    href: "/academia",
    labelKey: "academy",
    icon: GraduationCap,
    showInSidebar: true,
    showInBottomNav: false,
    section: "aprender",
  },
  {
    href: "/asistente",
    labelKey: "assistant",
    icon: Sparkles,
    showInSidebar: true,
    showInBottomNav: false,
    section: "aprender",
  },
  {
    href: "/configuracion",
    labelKey: "settings",
    icon: Settings,
    showInSidebar: true,
    showInBottomNav: false,
    section: "principal",
  },
] as const;

export const SETTINGS_HREF = "/configuracion";

export const sidebarItems = navItems.filter((item) => item.showInSidebar);
export const bottomNavItems = navItems.filter((item) => item.showInBottomNav);
export const moreSheetItems = navItems.filter((item) => !item.showInBottomNav);

const SECTION_LABELS = {
  principal: "Principal",
  nutricion: "Nutricion",
  entrenamiento: "Entrenamiento",
  aprender: "Aprender",
} satisfies Record<NavSection, string>;

const SECTION_ORDER: NavSection[] = [
  "principal",
  "nutricion",
  "entrenamiento",
  "aprender",
];

export type NavSectionGroup = {
  key: NavSection;
  label: string;
  items: NavItem[];
};

/**
 * Agrupa items por seccion, excluyendo Inicio y Configuracion porque ambos se
 * anclan por separado (Inicio arriba del riel, Configuracion en el pie).
 *
 * Sin excluir Inicio explicitamente, incluir "principal" en SECTION_ORDER lo
 * duplicaria; sin incluir "principal", Historial no aparece en ninguna parte.
 */
const ANCHORED_HREFS = new Set<string>(["/", SETTINGS_HREF]);

function groupBySection(items: readonly NavItem[]): NavSectionGroup[] {
  return SECTION_ORDER.map((key) => ({
    key,
    label: SECTION_LABELS[key],
    items: items.filter(
      (item) => item.section === key && !ANCHORED_HREFS.has(item.href),
    ),
  })).filter((group) => group.items.length > 0);
}

/** Secciones del sidebar de escritorio (Configuracion se ancla en el pie). */
export function getSidebarSections(): NavSectionGroup[] {
  return groupBySection(sidebarItems);
}

/** Secciones de la hoja "Mas" movil (Configuracion se ancla en el encabezado). */
export function getMoreSheetSections(): NavSectionGroup[] {
  return groupBySection(moreSheetItems);
}

export const homeNavItem = navItems.find((item) => item.href === "/")!;
export const settingsNavItem = navItems.find(
  (item) => item.href === SETTINGS_HREF,
)!;

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
