import { describe, expect, it, vi, afterEach } from "vitest";
import { passkeyDestination, passkeyError, supportsPasskeys } from "./passkeys";

afterEach(() => vi.unstubAllGlobals());

describe("passkey redirect boundary", () => {
  it.each([
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\n/evil.test",
    "javascript:alert(1)",
  ])("rejects unsafe destination %s", (next) => {
    expect(passkeyDestination(next)).toBe("/");
  });
  it("preserves internal destinations", () => {
    expect(passkeyDestination("/nutricion?dia=2#comidas")).toBe(
      "/nutricion?dia=2#comidas",
    );
  });
});

describe("passkey capability and errors", () => {
  it("requires secure context", () => {
    vi.stubGlobal("isSecureContext", false);
    expect(supportsPasskeys()).toBe(false);
  });
  it("does not expose raw server errors", () => {
    expect(passkeyError({ message: "secret internal detail" })).not.toContain(
      "secret",
    );
  });
  it("offers password fallback when cancelled or disabled", () => {
    expect(passkeyError({ name: "NotAllowedError" })).toContain("contraseña");
    expect(passkeyError({ code: "passkey_disabled" })).toContain("contraseña");
  });
});
