import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.auth.updatePassword.title };

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
