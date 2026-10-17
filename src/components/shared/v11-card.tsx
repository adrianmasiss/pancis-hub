import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type V11CardProps = {
  children: ReactNode;
  /** Posicion en la entrada escalonada: 50ms por puesto. */
  index?: number;
  className?: string;
  /** Rotulo accesible cuando la tarjeta no abre con un encabezado propio. */
  label?: string;
};

/**
 * La superficie de una tarjeta del lienzo v11, en un solo sitio.
 *
 * Las once tarjetas de Hoy repetian la misma cascara —doble borde, filete
 * especular, sombra larga y subida al pasar el raton— copiada en cada
 * archivo, y con los colores escritos a mano en hexadecimal. Copiada, no
 * compartida: nueve sitios donde cambiar un radio.
 *
 * Aqui va una vez y en tokens, asi que la tarjeta responde al modo claro y a
 * las ocho paletas en lugar de quedarse oscura sobre lienzo blanco.
 */
export function V11Card({
  children,
  index = 0,
  className,
  label,
}: V11CardProps) {
  return (
    <section
      aria-label={label}
      style={{ "--i": index } as CSSProperties}
      className={cn("v11-card enter-card", className)}
    >
      {children}
    </section>
  );
}

/** Encabezado de tarjeta: titulo a la izquierda, dato o control a la derecha. */
export function V11CardHead({
  title,
  aside,
}: {
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-foreground text-[15px] font-semibold tracking-[-0.01em]">
        {title}
      </h3>
      {aside}
    </div>
  );
}

/** La pastilla de dato del encabezado: "83 %", "InBody 07:10", "12 semanas". */
export function V11Chip({
  children,
  mono = false,
}: {
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex h-[30px] shrink-0 items-center rounded-full border border-[var(--v11-line)]",
        "bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] px-3 text-[12px]",
        mono && "font-mono tabular-nums",
      )}
    >
      {children}
    </span>
  );
}
