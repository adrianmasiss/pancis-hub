import { messages } from "@/i18n/es-419";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <main className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {messages.app.name}
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
