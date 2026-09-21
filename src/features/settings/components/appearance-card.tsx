"use client";

import { Check } from "lucide-react";
import { Section } from "@/components/shared/section";
import { useTheme } from "@/components/theme-provider";
import { PALETTES, PALETTE_NAMES } from "@/lib/theme/palettes";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "dark", label: messages.common.themeDark },
  { value: "light", label: messages.common.themeLight },
  { value: "system", label: messages.common.themeSystem },
] as const;

/**
 * Selector de paleta y modo.
 *
 * Cada muestra se pinta con los tokens REALES de esa paleta en el modo activo
 * —lienzo, superficie y acento— en vez de con un solo circulo de color: lo que
 * cambia entre paletas no es un acento suelto, son diecinueve valores, y una
 * muestra de un color no deja ver que le pasa al fondo ni a las tarjetas.
 */
export function AppearanceCard() {
  const { palette, setPalette, theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Section
      title={messages.settings.appearanceSection}
      description={messages.settings.appearanceDescription}
    >
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-subtle-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            {messages.settings.modeLabel}
          </legend>
          <div className="border-border bg-card-raised/50 grid h-11 grid-cols-3 gap-1 rounded-[14px] border p-[3px]">
            {MODES.map((option) => {
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "rounded-[11px] text-[13px] font-medium transition-colors duration-200",
                    active
                      ? "bg-card text-foreground border-border/60 border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-subtle-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            {messages.settings.paletteLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PALETTE_NAMES.map((name) => {
              const scheme = PALETTES[name][resolvedTheme];
              const active = palette === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPalette(name)}
                  title={name}
                  className={cn(
                    "focus-visible:ring-ring group relative flex flex-col gap-2 rounded-[14px] border p-2.5 text-left transition-[border-color,transform] duration-200 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px",
                    active
                      ? "border-primary"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="border-hairline flex h-12 overflow-hidden rounded-[9px] border"
                    style={{ background: scheme.bg }}
                  >
                    <span
                      className="h-full w-1/3"
                      style={{ background: scheme.sidebar }}
                    />
                    <span
                      className="m-1.5 flex-1 rounded-[5px]"
                      style={{ background: scheme.card }}
                    />
                    <span
                      className="my-1.5 mr-1.5 w-2.5 rounded-[3px]"
                      style={{ background: scheme.primary }}
                    />
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-medium">
                      {name}
                    </span>
                    {active ? (
                      <Check
                        className="text-primary size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </Section>
  );
}
