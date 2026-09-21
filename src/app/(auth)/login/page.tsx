import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthSplitPanel } from "@/features/auth/components/auth-split-panel";
import { LoadingSection } from "@/components/shared/loading-section";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.auth.login.title };

export default function LoginPage() {
  return (
    <AuthSplitPanel variant="login">
      <Suspense fallback={<LoadingSection rows={1} />}>
        <LoginForm />
      </Suspense>
    </AuthSplitPanel>
  );
}
