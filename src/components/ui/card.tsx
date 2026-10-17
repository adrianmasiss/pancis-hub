import * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // La superficie compartida mantiene borde, radio y sombra coherentes.
        // El respiro sube en pantallas grandes sin forzar alturas iguales.
        "surface-card group/card text-card-foreground flex flex-col gap-(--card-gap) overflow-hidden py-(--card-spacing) text-sm [--card-gap:--spacing(4)] [--card-spacing:--spacing(5)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-gap:--spacing(3)] data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 sm:[--card-spacing:--spacing(6)] sm:data-[size=sm]:[--card-spacing:--spacing(5)] *:[img:first-child]:rounded-t-[var(--radius-card)] *:[img:last-child]:rounded-b-[var(--radius-card)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // [handoff, regla 2] La cabecera cierra con regla divisoria: separa el
        // rotulo del dato sin necesidad de peso tipografico.
        "border-divider group/card-header @container/card-header mb-3.5 grid auto-rows-min items-start gap-1.5 border-b px-(--card-spacing) pb-2.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        // [handoff, regla 2] La cabecera de tarjeta es un eyebrow en
        // versalitas, no un titulo en negrita: el peso visual se lo lleva el
        // dato de la tarjeta, no su rotulo.
        //
        // Las versalitas se limitan al rotulo. Varias tarjetas del repo anidan
        // dentro del titulo una cifra o un enlace ("0 de 2091 kcal", "Ver plan
        // del dia"), y text-transform se hereda: sin esto salian tambien en
        // mayusculas, que ni corresponde a un dato ni a una accion.
        "card-eyebrow leading-snug [&_*]:tracking-normal [&_*]:normal-case",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "border-divider mt-(--card-gap) flex items-center rounded-b-[var(--radius-card)] border-t px-(--card-spacing) py-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
