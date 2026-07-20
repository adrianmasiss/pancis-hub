import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";

const t = messages.pwa;

export const metadata: Metadata = { title: t.offlineTitle };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandLogo height={40} />
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <WifiOff className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold">{t.offlineTitle}</h1>
      <p className="text-muted-foreground max-w-sm text-sm text-balance">
        {t.offlineDescription}
      </p>
      <Button asChild>
        <Link href="/">{t.retry}</Link>
      </Button>
    </div>
  );
}
