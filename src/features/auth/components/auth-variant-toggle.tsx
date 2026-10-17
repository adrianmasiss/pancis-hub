"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type AuthVariantToggleProps = {
  variant: "login" | "register";
  className?: string;
};

const OPTIONS = [
  { key: "login" as const, href: "/login", label: "Entrar" },
  { key: "register" as const, href: "/registro", label: "Crear cuenta" },
];

/**
 * Pastilla con thumb deslizante (desing-reference/ Pancis Login v4). A
 * diferencia del prototipo, no alterna estado local: cada opcion es un
 * `Link` real a /login o /registro, porque el repo mantiene esas rutas y
 * sus server actions por separado.
 */
export function AuthVariantToggle({
  variant,
  className,
}: AuthVariantToggleProps) {
  const activeIndex = variant === "login" ? 0 : 1;

  return (
    <div
      role="tablist"
      aria-label="Entrar o crear cuenta"
      className={cn(
        "border-border bg-card-raised/50 relative grid h-12 grid-cols-2 rounded-[14px] border p-[3px]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="bg-card border-border/60 absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-[11px] border transition-transform duration-[240ms] ease-[var(--ease-spring)]"
        style={{
          transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)",
        }}
      />
      {OPTIONS.map((option) => {
        const active = option.key === variant;
        return (
          <Link
            key={option.key}
            href={option.href}
            transitionTypes={["auth-swap"]}
            role="tab"
            aria-selected={active}
            className={cn(
              "relative z-10 flex items-center justify-center text-[14px] font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
