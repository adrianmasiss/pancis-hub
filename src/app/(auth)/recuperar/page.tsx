import type { Metadata } from "next";
import { RecoverForm } from "@/features/auth/components/recover-form";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.auth.recover.title };

export default function RecoverPage() {
  return <RecoverForm />;
}
