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
  /**
   * El riel tenia cuatro destinos y el Copiloto estaba suspendido. El handoff
   * de `desing-reference/` lo pone PRIMERO —es la puerta de entrada al
   * producto—, y el usuario confirmo que la app debe verse como el prototipo.
   * Con Evidencia cerrando, son los SEIS destinos de su conmutador `NAV`, en
   * su orden: copilot, inicio, dieta, rutina, progreso, evidencia.
   */
  it("el riel lleva los seis destinos del prototipo y Configuracion", () => {
    expect(sidebarItems.map((item) => item.href)).toEqual([
      "/asistente",
      "/",
      "/nutricion",
      "/entrenamiento",
      "/progreso",
      "/evidencia",
      "/configuracion",
    ]);
  });

  it("las rutas suspendidas siguen declaradas pero fuera de la navegacion", () => {
    const suspended = suspendedItems.map((item) => item.href);
    // El Asistente salio de esta lista: su motor existe y ahora se enlaza.
    expect(suspended).toEqual([
      "/recetas",
      "/despensa",
      "/historial",
      "/academia",
    ]);
    // Siguen en navItems: la ruta responde y el codigo se conserva.
    for (const href of suspended) {
      expect(navItems.some((item) => item.href === href)).toBe(true);
      expect(sidebarItems.some((item) => item.href === href)).toBe(false);
      expect(bottomNavItems.some((item) => item.href === href)).toBe(false);
      expect(moreSheetItems.some((item) => item.href === href)).toBe(false);
    }
  });

  /**
   * La barra inferior NO gana el quinto destino: en telefono cuatro celdas es
   * el limite comodo del pulgar, y el copiloto ya tiene su acceso permanente
   * en la barra superior.
   */
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
