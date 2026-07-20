import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <main className="animate-fade-up w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1>
            <BrandLogo height={64} />
          </h1>
          <p className="text-muted-foreground text-sm">
            {messages.app.tagline}
          </p>
        </div>
        {children}
        <p className="text-muted-foreground text-center text-xs text-balance">
          {messages.legal.disclaimer}
        </p>
      </main>
    </div>
  );
}
