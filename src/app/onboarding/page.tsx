import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";

export const metadata: Metadata = { title: messages.onboarding.title };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
      <main className="animate-fade-up space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandLogo height={48} />
          <h1 className="text-2xl font-semibold tracking-tight">
            {messages.onboarding.title}
          </h1>
        </div>
        <OnboardingWizard initialDisplayName={profile?.display_name ?? ""} />
        <p className="text-muted-foreground text-center text-xs text-balance">
          {messages.legal.disclaimer}
        </p>
      </main>
    </div>
  );
}
