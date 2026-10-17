"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import type { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type IconFieldProps = {
  icon: LucideIcon;
  label: string;
  error?: string;
  /** Regla del campo, dicha ANTES de fallar. No es un error: ni alerta ni
      color de error, y desaparece cuando hay uno de verdad que leer. */
  hint?: string;
  className?: string;
} & React.ComponentProps<typeof Input>;

/**
 * Campo con rotulo visible encima e icono DENTRO del marco.
 *
 * La pieza con borde es el envoltorio (`.field-shell`), no el `<input>`: es
 * la anatomia de la referencia que mando el usuario, y es la que deja el
 * icono dentro del marco en vez de flotando sobre el. El `<input>` de dentro
 * es transparente y sin anillo propio; el foco lo marca el envoltorio con
 * `:focus-within`.
 *
 * El rotulo pasa a ser VISIBLE. Estaba en `sr-only` con la idea de que el
 * icono y el placeholder identificaban el campo, y eso falla en cuanto el
 * campo tiene texto: el placeholder desaparece y solo queda un icono. La
 * referencia los pone encima, y ahi se quedan.
 */
export function IconField({
  icon: Icon,
  label,
  error,
  hint,
  className,
  id: idProp,
  ...inputProps
}: IconFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id} className="field-label">
        {label}
      </Label>
      <div className="field-shell" data-invalid={error ? true : undefined}>
        <Icon aria-hidden="true" className="size-[18px]" />
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-subtle-foreground mt-2 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
