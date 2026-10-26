import { describe, expect, it } from "vitest";
import { timeBetween } from "./today";

describe("timeBetween", () => {
  it("pone la comida en el punto medio, redondeado a cinco minutos", () => {
    expect(timeBetween("07:00", "10:00")).toBe("08:30");
    expect(timeBetween("12:00", "12:20")).toBe("12:10");
  });
  it("usa el minuto exacto si el redondeo se sale del hueco", () => {
    expect(timeBetween("12:00", "12:04")).toBe("12:02");
  });
  it("sin hueco, iguala la hora de la anterior", () => {
    expect(timeBetween("12:00", "12:01")).toBe("12:00");
  });
  it("en un extremo, media hora antes o despues", () => {
    expect(timeBetween(null, "07:00")).toBe("06:30");
    expect(timeBetween("23:40", null)).toBe("23:55");
    expect(timeBetween(null, "00:10")).toBe("00:00");
  });
  it("sin vecinas con hora no hay hora", () => {
    expect(timeBetween(null, null)).toBeNull();
  });
});
