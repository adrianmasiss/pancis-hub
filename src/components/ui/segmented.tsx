"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: string;
};

type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre accesible del grupo, obligatorio: es una barra de pestanas. */
  label: string;
  className?: string;
};

/**
 * Control segmentado de vidrio (handoff v2, regla 4).
 *
 * Sustituye a los grupos de chips sueltos: un contenedor pildora contiene
 * todas las opciones, y la activa se rellena con el acento. Al ser un grupo
 * unico, se lee como "una eleccion entre N" y no como N filtros
 * independientes.
 *
 * Accesibilidad: es un tablist real. Las flechas mueven el foco y la opcion
 * activa se anuncia con aria-selected, no solo con color.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  const activeIndex = options.findIndex((option) => option.value === value);

  const focusOption = (index: number, element: HTMLElement) => {
    const next = element.parentElement?.children[index];
    if (next instanceof HTMLElement) next.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("segmented", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                return;
              }
              event.preventDefault();
              const delta = event.key === "ArrowRight" ? 1 : -1;
              const nextIndex =
                (activeIndex + delta + options.length) % options.length;
              onChange(options[nextIndex]!.value);
              focusOption(nextIndex, event.currentTarget);
            }}
            className={cn(
              "rounded-full px-[15px] py-[7px] text-[12.5px] whitespace-nowrap transition-all duration-150",
              active
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground bg-transparent",
            )}
            style={
              active
                ? {
                    boxShadow:
                      "0 0 16px -3px color-mix(in oklch, var(--primary) 55%, transparent), inset 0 1px 0 oklch(1 0 0 / 28%)",
                  }
                : undefined
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
