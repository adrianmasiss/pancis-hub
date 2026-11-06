import { describe, expect, it } from "vitest";
import { commonsFileUrl, commonsThumb, pickLogo } from "./logo";

const entity = (desc: string, file?: string) => ({
  descriptions: { en: { value: desc } },
  claims: file
    ? { P154: [{ mainsnak: { datavalue: { value: file } } }] }
    : undefined,
});

describe("pickLogo", () => {
  it("salta lo que no es comida aunque tenga logo", () => {
    const url = pickLogo(["Q1", "Q2", "Q3"], {
      Q1: entity("rapid transit system", "Metro logo.svg"),
      Q2: entity("1985 film directed by Luc Besson"),
      Q3: entity("American sandwich restaurant chain", "Subway 2016 logo.svg"),
    });
    expect(url).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Subway_2016_logo.svg",
    );
  });

  it("prefiere el logo vigente, sin eslogan y no de un solo pais", () => {
    const fin = (time: string) => [{ datavalue: { value: { time } } }];
    const url = pickLogo(["Q1"], {
      Q1: {
        descriptions: { en: { value: "fast food restaurant chain" } },
        claims: {
          P154: [
            {
              rank: "preferred",
              mainsnak: { datavalue: { value: "M with slogan.svg" } },
            },
            {
              mainsnak: { datavalue: { value: "M verde.svg" } },
              qualifiers: { P1001: [{}] },
            },
            {
              mainsnak: { datavalue: { value: "M arcos.svg" } },
              qualifiers: { P582: fin("+2020") },
            },
            {
              mainsnak: { datavalue: { value: "M 1975.svg" } },
              qualifiers: { P582: fin("+2006") },
            },
          ],
        },
      },
    });
    expect(url).toMatch(/M_arcos\.svg$/);
  });

  it("sin logo de comida no devuelve nada", () => {
    expect(pickLogo(["Q1"], { Q1: entity("restaurant chain") })).toBeNull();
  });

  it("codifica el nombre del archivo", () => {
    expect(commonsFileUrl("McDonald's Golden Arches.svg")).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/McDonald's_Golden_Arches.svg",
    );
  });
});

describe("commonsThumb", () => {
  it("arma la miniatura directa de un SVG", () => {
    expect(commonsThumb(commonsFileUrl("Burger King 2020.svg"))).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/120px-Burger_King_2020.svg.png",
    );
  });

  it("no acepta otro origen", () => {
    expect(commonsThumb("https://example.com/logo.png")).toBeNull();
  });
});
