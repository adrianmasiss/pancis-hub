import { BrandLogo } from "@/components/shared/brand-logo";
import { messages } from "@/i18n/es-419";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* Fondo liso. `bg-ambient-aura` era el halo del sistema anterior; hoy
       globals.css ya lo deja en `background: none`, asi que la clase solo
       quedaba como resto que confunde al leer. */
    <div className="relative min-h-dvh overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <main className="animate-fade-up relative z-10 mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="hidden max-w-xl space-y-8 lg:block">
          <div className="space-y-5">
            <h1>
              <BrandLogo height={72} />
            </h1>
            <div className="space-y-3">
              <p className="text-4xl font-semibold leading-tight text-foreground [letter-spacing:0]">
                Tu centro operativo para recomposicion real.
              </p>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Nutricion, entrenamiento, progreso y decisiones asistidas en una
                experiencia clara, medible y lista para uso diario.
              </p>
            </div>
          </div>

          <div className="grid max-w-lg grid-cols-3 gap-3">
            {[
              ["Macros", "Plan diario"],
              ["Rutinas", "Siguiente sesion"],
              ["Progreso", "Tendencias"],
            ].map(([label, value]) => (
              <div key={label} className="surface-card px-4 py-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md space-y-5">
          <div className="flex flex-col items-center gap-2 text-center lg:hidden">
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
        </section>
      </main>
    </div>
  );
}
