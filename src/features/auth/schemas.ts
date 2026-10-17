import { z } from "zod";
import { messages } from "@/i18n/es-419";
import {
  esUsuarioValido,
  normalizarUsuario,
  pareceCorreo,
} from "@/features/auth/username";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email(messages.auth.errors.invalidEmail);

const password = z.string().min(8, messages.auth.errors.weakPassword);

/**
 * Un solo campo para entrar: correo o usuario.
 *
 * No se validan los dos formatos con la misma dureza. Si lleva arroba, tiene
 * que ser un correo bien escrito —ahi el error ayuda—; si no, basta con que
 * sea un usuario posible. Lo que NO se hace es responder distinto segun exista
 * o no: eso convertiria la pantalla en un detector de cuentas.
 */
const identifier = z
  .string()
  .trim()
  .min(1, messages.auth.errors.identifierRequired)
  .transform((valor) =>
    pareceCorreo(valor) ? valor.toLowerCase() : normalizarUsuario(valor),
  )
  .refine(
    (valor) =>
      pareceCorreo(valor)
        ? z.string().email().safeParse(valor).success
        : esUsuarioValido(valor),
    messages.auth.errors.invalidCredentials,
  );

const username = z
  .string()
  .trim()
  .transform(normalizarUsuario)
  .refine(esUsuarioValido, messages.auth.errors.usernameInvalid);

export const loginSchema = z.object({
  identifier,
  password: z.string().min(1, messages.auth.errors.invalidCredentials),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, messages.auth.errors.nameRequired),
    username,
    email,
    password,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: messages.auth.errors.passwordMismatch,
    path: ["passwordConfirm"],
  });

export const recoverSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: messages.auth.errors.passwordMismatch,
    path: ["passwordConfirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RecoverInput = z.infer<typeof recoverSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
