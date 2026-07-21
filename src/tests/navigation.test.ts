import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/es-419";
import {
  bottomNavItems,
  isActiveRoute,
  moreSheetItems,
  navItems,
  sidebarItems,
} from "@/lib/navigation";

describe("navegacion", () => {
  it("tiene 8 entradas de sidebar (Diario removido)", () => {
    expect(sidebarItems).toHaveLength(8);
  });

  it("tiene 4 entradas en la barra inferior mas el sheet de Mas", () => {
    expect(bottomNavItems).toHaveLength(4);
    expect(moreSheetItems.length + bottomNavItems.length).toBe(navItems.length);
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
