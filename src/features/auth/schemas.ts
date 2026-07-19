import { z } from "zod";
import { messages } from "@/i18n/es-419";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email(messages.auth.errors.invalidEmail);

const password = z.string().min(8, messages.auth.errors.weakPassword);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, messages.auth.errors.invalidCredentials),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, messages.auth.errors.nameRequired),
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
