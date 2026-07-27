"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Sin rebote ni cambio de escala: la respuesta al toque es un cambio de tono.
  //
  // Deshabilitado no se resuelve bajando la opacidad de todo el boton: sobre
  // el acento naranja eso dejaba el texto casi ilegible, y es el estado con el
  // que abre cualquier formulario vacio. Se cambia a superficie apagada con
  // texto apagado, que se lee y ademas comunica mejor "aqui todavia no".
  // El paso a :active baja a 75ms para que la pulsacion se sienta inmediata;
  // los 200ms se reservan al hover, donde el cambio debe leerse suave.
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap [letter-spacing:0] transition-colors duration-200 active:duration-75 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // --btn-glow define el tono del halo que sigue al cursor en cada variante:
      // luz sobre superficies llenas, bronce sobre superficies claras.
      variant: {
        default:
          "btn-spotlight bg-primary text-primary-foreground [--btn-glow:color-mix(in_oklch,white_26%,transparent)] hover:bg-primary/92 active:bg-primary/84",
        outline:
          "btn-spotlight border-hairline bg-card hover:border-primary/35 hover:text-foreground active:bg-muted [--btn-glow:color-mix(in_oklch,var(--primary)_14%,transparent)] aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "btn-spotlight bg-secondary text-secondary-foreground active:bg-secondary/75 [--btn-glow:color-mix(in_oklch,var(--foreground)_8%,transparent)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "btn-spotlight hover:text-foreground active:bg-muted [--btn-glow:color-mix(in_oklch,var(--foreground)_7%,transparent)] aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:active:bg-destructive/40 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/75 disabled:bg-transparent",
      },
      // Alturas algo mas generosas que las heredadas: el objetivo tactil
      // minimo en movil es 40px y el texto deja de sentirse comprimido.
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-sm px-2.5 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-sm px-3 text-[0.8125rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-sm in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-sm in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  onPointerMove,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  /**
   * Escribe la posicion del puntero directamente en el estilo del nodo. Se evita
   * useState a proposito: mover el raton sobre un boton no debe provocar
   * renders de React.
   */
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerMove?.(event);
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--btn-x", `${event.clientX - rect.left}px`);
      el.style.setProperty("--btn-y", `${event.clientY - rect.top}px`);
    },
    [onPointerMove],
  );

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerMove={handlePointerMove}
      {...props}
    />
  );
}

export { Button, buttonVariants };
