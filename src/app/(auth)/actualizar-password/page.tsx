import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { AuthPanel } from "@/features/auth/components/auth-panel";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.auth.updatePassword.title };

export default function UpdatePasswordPage() {
  return (
    <AuthPanel
      title={messages.auth.updatePassword.title}
      description={messages.auth.updatePassword.description}
    >
      <UpdatePasswordForm />
    </AuthPanel>
  );
}
