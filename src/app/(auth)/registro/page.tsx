import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.auth.register.title };

export default function RegisterPage() {
  return <RegisterForm />;
}
