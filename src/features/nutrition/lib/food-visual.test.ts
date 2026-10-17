import { describe, expect, it } from "vitest";
import { foodVisual } from "./food-visual";

describe("foodVisual", () => {
  it("usa la foto local por palabra entera y sin tildes", () => {
    expect(foodVisual({ name: "Brócoli", group: "verdura" }).src).toBe(
      "/foods/brocoli.webp",
    );
    expect(foodVisual({ name: "Clara de huevo" }).src).toBe(
      "/foods/huevo.webp",
    );
  });

  it("no confunde papa con papaya ni pan con panqueque", () => {
    expect(foodVisual({ name: "Papaya", group: "fruta" }).src).toBeNull();
    expect(foodVisual({ name: "Panqueque" }).src).toBeNull();
  });

  it("la foto propia del alimento manda sobre la local", () => {
    expect(
      foodVisual({ name: "Pan integral", imageUrl: "https://x/y.jpg" }).src,
    ).toBe("https://x/y.jpg");
  });

  it("sin foto cae a la ilustracion del grupo, y el atun es pescado", () => {
    expect(foodVisual({ name: "Arroz blanco", group: "carbohidrato" })).toEqual(
      { src: null, illustration: "carbohidrato" },
    );
    expect(
      foodVisual({ name: "Atun en agua", group: "proteina" }).illustration,
    ).toBe("pescado");
    expect(foodVisual({ name: "Algo", group: "raro" }).illustration).toBe(
      "otro",
    );
  });
});
