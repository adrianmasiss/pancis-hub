import Link from "next/link";
import { ViewTransition } from "react";
import { cn } from "@/lib/utils";
import { messages } from "@/i18n/es-419";

type AuthSplitPanelProps = {
  variant: "login" | "register";
  children: React.ReactNode;
};

/**
 * Los dos paneles de Acceso: el formulario y el panel terracota que invita a
 * la otra puerta. El patron viene del video de referencia del usuario, pero
 * solo su COMPORTAMIENTO: el panel cambia de lado al cambiar de intencion. El
 * color es el acento del sistema, no un segundo color de marca.
 *
 * Solo desde `lg` (1024px). En movil no hay ancho para dos columnas y el
 * cambio lo resuelve `AuthVariantToggle` dentro del formulario.
 *
 * El intercambio ocurre entre /login y /registro, rutas reales con sus propias
 * server actions. El "mismo panel cambia de lado" no es estado local: ambos
 * paneles comparten `name` entre las dos paginas y la View Transitions API
 * anima la reubicacion. Las curvas viven en globals.css.
 */
export function AuthSplitPanel({ variant, children }: AuthSplitPanelProps) {
  const isLogin = variant === "login";
  const copy = isLogin
    ? messages.auth.splitPanel.toRegister
    : messages.auth.splitPanel.toLogin;
  const ctaHref = isLogin ? "/registro" : "/login";
  const ctaLabel = isLogin
    ? messages.auth.register.submit
    : messages.auth.login.cta;

  return (
    <main
      className={cn(
        "auth-card animate-fade-up w-full max-w-[460px] lg:grid lg:min-h-[608px] lg:max-w-[1000px] lg:items-stretch",
        // Las columnas se definen por variante, no solo con `order`: si el
        // ancho se quedara fijo, el panel cambiaria de lado Y de tamano, y el
        // morph dejaria de leerse como la misma pieza moviendose.
        isLogin ? "lg:grid-cols-[1fr_0.78fr]" : "lg:grid-cols-[0.78fr_1fr]",
      )}
    >
      <ViewTransition name="auth-form-panel" share="auth-panel">
        <div
          className={cn(
            "flex min-w-0 items-center justify-center px-6 py-9 sm:px-10 sm:py-11 lg:px-12",
            isLogin ? "lg:order-1" : "lg:order-2",
          )}
        >
          <ViewTransition
            name="auth-form-content"
            share="auth-content"
            default="none"
          >
            <div className="w-full max-w-[380px]">{children}</div>
          </ViewTransition>
        </div>
      </ViewTransition>

      <ViewTransition name="auth-accent-panel" share="auth-panel">
        <div
          className={cn(
            "auth-accent hidden lg:flex lg:min-w-0 lg:flex-col lg:justify-between lg:p-9",
            isLogin ? "lg:order-2" : "lg:order-1",
          )}
        >
          <ViewTransition
            name="auth-accent-content"
            share="auth-content"
            default="none"
          >
            <div className="flex h-full flex-col justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase opacity-70">
                {messages.app.name}
              </p>

              <div className="flex flex-col items-start gap-4 pb-4">
                <h2 className="page-display max-w-[14ch] text-balance">
                  {copy.heading}
                </h2>
                <p className="max-w-[32ch] text-[15px] leading-[1.55] opacity-80">
                  {copy.body}
                </p>
                <Link
                  href={ctaHref}
                  transitionTypes={["auth-swap"]}
                  // `text-[...]` explicito: la capa base tine TODO enlace con
                  // `--primary`, que aqui es el propio fondo del panel. Sin
                  // esto el boton es naranja sobre naranja y desaparece.
                  className="mt-2 inline-flex h-[52px] items-center justify-center rounded-[14px] border border-current px-7 text-[15px] font-bold tracking-[-0.01em] text-[var(--primary-foreground)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--primary-foreground)] hover:text-[var(--primary)] focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary)] focus-visible:outline-none active:scale-[0.985] active:duration-75"
                >
                  {ctaLabel}
                </Link>
              </div>

              {/* Filete de medicion: el motivo del sistema cerrando el panel,
                  en vez de espacio muerto o una ilustracion de relleno. */}
              <div
                aria-hidden="true"
                className="flex items-end justify-between"
              >
                {Array.from({ length: 32 }, (_, i) => (
                  <span
                    key={i}
                    className="w-px bg-current"
                    style={{
                      height: i % 8 === 0 ? 18 : 9,
                      opacity: i % 8 === 0 ? 0.6 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
          </ViewTransition>
        </div>
      </ViewTransition>
    </main>
  );
}
