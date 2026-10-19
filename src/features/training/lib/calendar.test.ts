import { describe, expect, it } from "vitest";
import { groupByDate, monthGrid, shiftMonth } from "./calendar";

describe("monthGrid", () => {
  it("empieza en lunes y deja vacío lo de otros meses", () => {
    // Octubre de 2026 empieza en jueves y termina en sábado.
    const { weeks } = monthGrid("2026-10");
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(weeks.at(-1)?.at(-2)).toBe("2026-10-31");
    expect(weeks.at(-1)?.at(-1)).toBeNull();
  });

  it("febrero que empieza en lunes cabe en cuatro semanas", () => {
    expect(monthGrid("2027-02").weeks).toHaveLength(4);
  });
});

describe("shiftMonth", () => {
  it("cruza años en las dos direcciones", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("groupByDate", () => {
  it("junta lo del mismo día", () => {
    const map = groupByDate(
      [
        { id: "a", d: "2026-10-14" },
        { id: "b", d: "2026-10-14" },
        { id: "c", d: "2026-10-15" },
      ],
      (x) => x.d,
    );
    expect(map.get("2026-10-14")?.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
