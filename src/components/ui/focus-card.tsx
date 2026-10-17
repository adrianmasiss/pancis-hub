"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "./focus-card.css";

/**
 * Tarjeta de foco: sustituir y comparar se abren SIEMPRE aqui (criterio del
 * usuario, oct 2026). Centrada sobre la pantalla, con la superficie v11 y su
 * filo giratorio (`v11-card pc-live-edge`), y todo lo demas difuminado
 * detras. Es un dialogo modal de Radix: foco atrapado, Escape y clic fuera
 * cierran, y el lector anuncia titulo y descripcion.
 *
 * `layout="card"` es una sola tarjeta (sustituir). `layout="stage"` es un
 * escenario transparente para contenido que ya trae sus propias tarjetas,
 * como las dos de comparar: envolverlas en otra seria tarjeta dentro de
 * tarjeta.
 */
const FocusCard = DialogPrimitive.Root;
const FocusCardTrigger = DialogPrimitive.Trigger;
const FocusCardClose = DialogPrimitive.Close;

function FocusCardContent({
  className,
  children,
  layout = "card",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  layout?: "card" | "stage";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="focus-card-overlay" />
      <DialogPrimitive.Content
        className={cn(
          "focus-card",
          layout === "card" && "v11-card pc-live-edge",
          className,
        )}
        data-layout={layout}
        {...props}
      >
        <div className="focus-card-scroll">{children}</div>
        <DialogPrimitive.Close className="focus-card-close">
          <XIcon size={16} aria-hidden="true" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function FocusCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("focus-card-header", className)} {...props} />;
}

function FocusCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("focus-card-title", className)}
      {...props}
    />
  );
}

function FocusCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("focus-card-description", className)}
      {...props}
    />
  );
}

export {
  FocusCard,
  FocusCardTrigger,
  FocusCardClose,
  FocusCardContent,
  FocusCardHeader,
  FocusCardTitle,
  FocusCardDescription,
};
