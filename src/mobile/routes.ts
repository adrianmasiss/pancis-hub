import {
  Dumbbell,
  Home,
  Sparkles,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/**
 * Barra inferior de la vista movil: los cuatro destinos del diseño mas «Hoy»,
 * que el usuario pidio conservar (oct 2026).
 */
export type MobileNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const MOBILE_NAV: readonly MobileNavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/entrenamiento", label: "Entrenar", icon: Dumbbell },
  { href: "/asistente", label: "Copiloto", icon: Sparkles },
  { href: "/nutricion", label: "Nutrición", icon: Utensils },
  { href: "/progreso", label: "Progreso", icon: TrendingUp },
];

/**
 * Rutas que ya tienen pantalla movil propia. Las demas siguen, en telefono,
 * con el acomodo de `movil.css` sobre los componentes de escritorio hasta que
 * se porten. Cada `page.tsx` de esta lista se bifurca con `isPhone()`.
 */
const MOBILE_READY: readonly RegExp[] = [
  /^\/$/,
  /^\/entrenamiento(\/|$)/,
  /^\/nutricion$/,
  // Alta de alimentos y revision de fuentes: pantallas de escritorio dentro
  // del marco movil (MobileFormsFrame). La dieta sigue con su acomodo.
  /^\/nutricion\/alimentos(\/|$)/,
  /^\/asistente$/,
  /^\/progreso$/,
  /^\/configuracion$/,
];

export function isMobileReady(pathname: string): boolean {
  return MOBILE_READY.some((re) => re.test(pathname));
}

export function isActiveMobileRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Donde se montan los sheets: dentro de `.m-app`, para heredar sus tokens. */
export const MOBILE_PORTAL_ID = "m-portal";
