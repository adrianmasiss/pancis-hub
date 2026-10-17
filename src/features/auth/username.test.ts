import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/features/auth/schemas";
import {
  esUsuarioValido,
  normalizarUsuario,
  pareceCorreo,
} from "@/features/auth/username";

describe("formato del usuario", () => {
  it("acepta de 3 a 20 con letras, digitos, punto y guion bajo", () => {
    for (const valido of ["ana", "adrian.masis", "user_01", "a".repeat(20)]) {
      expect(esUsuarioValido(valido)).toBe(true);
    }
  });

  it("rechaza lo corto, lo largo, el signo inicial y lo que no es", () => {
    for (const invalido of [
      "ab",
      "a".repeat(21),
      ".adrian",
      "_adrian",
      "con espacio",
      "con-guion",
      "correo@casa.com",
      "acentuación",
    ]) {
      expect(esUsuarioValido(invalido)).toBe(false);
    }
  });

  it("normaliza a minusculas y sin espacios alrededor", () => {
    expect(normalizarUsuario("  AdriaN  ")).toBe("adrian");
    // Y por eso "Adrian" y "adrian" no pueden ser dos cuentas distintas.
    expect(esUsuarioValido("Adrian")).toBe(true);
  });
});

describe("que se escribio para entrar", () => {
  it("la arroba decide", () => {
    expect(pareceCorreo("demo@pancis.local")).toBe(true);
    expect(pareceCorreo("demo")).toBe(false);
  });

  it("el identificador admite las dos formas, ya normalizadas", () => {
    expect(loginSchema.parse({ identifier: " Demo ", password: "x" })).toEqual({
      identifier: "demo",
      password: "x",
    });
    expect(
      loginSchema.parse({ identifier: "DEMO@Pancis.Local", password: "x" }),
    ).toMatchObject({ identifier: "demo@pancis.local" });
  });

  it("rechaza un correo mal escrito y un usuario imposible", () => {
    expect(
      loginSchema.safeParse({ identifier: "demo@", password: "x" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ identifier: "ab", password: "x" }).success,
    ).toBe(false);
  });
});

describe("alta", () => {
  const base = {
    displayName: "Ana",
    email: "ana@pancis.local",
    password: "12345678",
    passwordConfirm: "12345678",
  };

  it("guarda el usuario en minusculas", () => {
    const parsed = registerSchema.parse({ ...base, username: "  AnaM  " });
    expect(parsed.username).toBe("anam");
  });

  it("no deja pasar un usuario con formato invalido", () => {
    expect(registerSchema.safeParse({ ...base, username: "a b" }).success).toBe(
      false,
    );
  });
});
