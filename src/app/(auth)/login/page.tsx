import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoadingSection } from "@/components/shared/loading-section";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.auth.login.title };

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSection rows={1} />}>
      <LoginForm />
    </Suspense>
  );
}
