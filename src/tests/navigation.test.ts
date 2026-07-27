import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/es-419";
import {
  bottomNavItems,
  isActiveRoute,
  moreSheetItems,
  navItems,
  sidebarItems,
  suspendedItems,
} from "@/lib/navigation";

describe("navegacion", () => {
  it("el riel se repliega a las cuatro pantallas mas Configuracion", () => {
    expect(sidebarItems.map((item) => item.href)).toEqual([
      "/",
      "/nutricion",
      "/entrenamiento",
      "/progreso",
      "/configuracion",
    ]);
  });

  it("las rutas suspendidas siguen declaradas pero fuera de la navegacion", () => {
    const suspended = suspendedItems.map((item) => item.href);
    expect(suspended).toEqual([
      "/recetas",
      "/despensa",
      "/historial",
      "/academia",
      "/asistente",
    ]);
    // Siguen en navItems: la ruta responde y el codigo se conserva.
    for (const href of suspended) {
      expect(navItems.some((item) => item.href === href)).toBe(true);
      expect(sidebarItems.some((item) => item.href === href)).toBe(false);
      expect(bottomNavItems.some((item) => item.href === href)).toBe(false);
      expect(moreSheetItems.some((item) => item.href === href)).toBe(false);
    }
  });

  it("la barra inferior conserva sus cuatro destinos", () => {
    expect(bottomNavItems.map((item) => item.href)).toEqual([
      "/",
      "/nutricion",
      "/entrenamiento",
      "/progreso",
    ]);
  });

  it("cada entrada tiene etiqueta traducida en es-419", () => {
    for (const item of navItems) {
      expect(messages.nav[item.labelKey]).toBeTruthy();
      if (item.bottomNavLabelKey) {
        expect(messages.nav[item.bottomNavLabelKey]).toBeTruthy();
      }
    }
  });

  it("no hay rutas duplicadas", () => {
    const hrefs = navItems.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("marca la ruta activa correctamente", () => {
    expect(isActiveRoute("/", "/")).toBe(true);
    expect(isActiveRoute("/nutricion", "/")).toBe(false);
    expect(isActiveRoute("/nutricion", "/nutricion")).toBe(true);
    expect(isActiveRoute("/nutricion/comidas", "/nutricion")).toBe(true);
    expect(isActiveRoute("/recetas", "/nutricion")).toBe(false);
  });
});
