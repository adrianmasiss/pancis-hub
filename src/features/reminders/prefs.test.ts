import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFS, parseNotificationPrefs } from "./prefs";

describe("parseNotificationPrefs", () => {
  it("sin nada guardado usa los valores por defecto", () => {
    expect(parseNotificationPrefs({})).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(parseNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it("completa un tipo a medias con sus valores por defecto", () => {
    const p = parseNotificationPrefs({ entreno: { hora: "06:30" } });
    expect(p.entreno).toEqual({ on: true, hora: "06:30" });
  });

  it("un tipo invalido no tumba los demas", () => {
    const p = parseNotificationPrefs({
      agua: { on: true, hora: "25:00" },
      semanal: { on: true, dia: 5, hora: "20:00" },
    });
    expect(p.agua).toEqual(DEFAULT_NOTIFICATION_PREFS.agua);
    expect(p.semanal).toEqual({ on: true, dia: 5, hora: "20:00" });
  });
});
