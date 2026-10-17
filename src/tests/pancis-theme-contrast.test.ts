import { describe, expect, it } from "vitest";
import { PALETTES } from "@/lib/theme/palettes";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
for (const mode of ["dark", "light"] as const) {
  describe(`Pancis ${mode}: legibility`, () => {
    const p = PALETTES.Pancis[mode];
    for (const surface of ["bg", "card", "raised"] as const) {
      for (const ink of ["fg", "muted", "subtle"] as const) {
        it(`${ink} on ${surface} meets normal-text contrast`, () =>
          expect(contrast(p[ink], p[surface])).toBeGreaterThanOrEqual(4.5));
      }
    }
    it("soft labels use the main ink or primary, not secondary gray", () => {
      expect(contrast(p.fg, p.soft)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.primary, p.soft)).toBeGreaterThanOrEqual(4.5);
    });
    it("button text remains readable throughout the gradient and hover", () => {
      for (const paint of [p.primary, p.primaryStrong, p.brandFrom, p.brandTo])
        expect(contrast(p.primaryFg, paint)).toBeGreaterThanOrEqual(4.5);
    });
    it("focus, inputs, charts and status labels remain distinct from surfaces", () => {
      for (const surface of [p.bg, p.card, p.raised]) {
        for (const paint of [p.primary, p.border, p.chart])
          expect(contrast(paint, surface)).toBeGreaterThanOrEqual(3);
        for (const ink of [p.critical, p.positive, p.caution])
          expect(contrast(ink, surface)).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
}
