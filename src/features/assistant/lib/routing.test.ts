import { describe, expect, it } from "vitest";
import { detectIntent } from "./rules";
import { routeAssistantQuestion } from "./routing";

function route(
  message: string,
  extra: { deep?: boolean; image?: boolean } = {},
) {
  return routeAssistantQuestion({
    message,
    intent: detectIntent(message),
    explainedFromRegistry: false,
    hasImage: extra.image ?? false,
    deep: extra.deep ?? false,
  });
}

describe("routeAssistantQuestion", () => {
  it("un sintoma clinico lo contestan las reglas, aunque se pida a fondo", () => {
    expect(route("Tengo dolor en el pecho al entrenar")).toBe("reglas");
    expect(route("Tengo dolor en el pecho al entrenar", { deep: true })).toBe(
      "reglas",
    );
  });

  it("el por que de un numero con texto aprobado no pasa por la IA", () => {
    expect(
      routeAssistantQuestion({
        message: "por que mi proteina es esa",
        intent: { kind: "whyThisNumber", formulaKey: "protein" },
        explainedFromRegistry: true,
        hasImage: false,
        deep: true,
      }),
    ).toBe("reglas");
  });

  it("lo que ya calcularon los motores va al modelo rapido", () => {
    expect(route("No tengo arroz")).toBe("rapido");
    expect(route("Hoy voy a comer pizza")).toBe("rapido");
    expect(route("No llegue a la proteina hoy")).toBe("rapido");
    expect(route("que como hoy?")).toBe("rapido");
  });

  it("las preguntas que piden criterio van al modelo fino", () => {
    expect(route("¿Me conviene hacer ayuno intermitente?")).toBe("fino");
    expect(route("¿Vale la pena tomar creatina?")).toBe("fino");
    expect(route("Revisa mi rutina, ¿está bien?")).toBe("fino");
    expect(route("Mi peso no baja desde hace dos semanas")).toBe("fino");
  });

  it("una foto o el pedido a fondo usan el modelo fino", () => {
    expect(route("que como hoy?", { image: true })).toBe("fino");
    expect(route("No tengo arroz", { deep: true })).toBe("fino");
  });
});
