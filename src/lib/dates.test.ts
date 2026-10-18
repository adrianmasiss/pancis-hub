import { afterEach, describe, expect, it, vi } from "vitest";
import { localDateOf, todayInTimezone, weekBoundsISO } from "@/lib/dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("todayInTimezone", () => {
  it("devuelve el dia del perfil, no el del servidor", () => {
    // 11 de agosto a las 05:00 UTC son todavia las 23:00 del dia 10 en Costa
    // Rica. Con toISOString() esto fechaba el objetivo en el futuro; se vio
    // pasando de verdad, no en una prueba.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T05:00:00Z"));

    expect(todayInTimezone("America/Costa_Rica")).toBe("2026-08-10");
    expect(todayInTimezone("UTC")).toBe("2026-08-11");
  });

  it("adelanta el dia en zonas al este", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T22:00:00Z"));

    expect(todayInTimezone("Asia/Tokyo")).toBe("2026-08-11");
  });

  it("cae a UTC si la zona no existe", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T05:00:00Z"));

    expect(todayInTimezone("Marte/Olympus")).toBe("2026-08-11");
  });
});

describe("weekBoundsISO", () => {
  it("va de lunes a domingo", () => {
    // 2026-10-14 es miércoles.
    expect(weekBoundsISO("2026-10-14")).toEqual({
      start: "2026-10-12",
      end: "2026-10-18",
    });
  });

  it("el domingo cierra su semana, no abre la siguiente", () => {
    expect(weekBoundsISO("2026-10-18").start).toBe("2026-10-12");
    expect(weekBoundsISO("2026-10-19").start).toBe("2026-10-19");
  });

  it("cruza meses y años", () => {
    expect(weekBoundsISO("2027-01-01")).toEqual({
      start: "2026-12-28",
      end: "2027-01-03",
    });
  });
});

describe("localDateOf", () => {
  it("fecha la sesión en la zona del usuario, no en UTC", () => {
    expect(localDateOf("2026-10-13T04:00:00Z", "America/Costa_Rica")).toBe(
      "2026-10-12",
    );
    expect(localDateOf("2026-10-13T04:00:00Z", "Marte/Olympus")).toBe(
      "2026-10-13",
    );
  });
});
