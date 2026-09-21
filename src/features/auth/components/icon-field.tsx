"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type IconFieldProps = {
  icon: LucideIcon;
  label: string;
  error?: string;
  className?: string;
} & React.ComponentProps<typeof Input>;

/**
 * Campo con icono a la izquierda dentro del propio contenedor (patron que el
 * usuario trajo como referencia). El label es visible solo para lectores de
 * pantalla: el diseno de Acceso identifica el campo por el icono y el
 * placeholder, no por un rotulo encima.
 */
export function IconField({
  icon: Icon,
  label,
  error,
  className,
  id: idProp,
  ...inputProps
}: IconFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2"
        />
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-12 rounded-[12px] pl-11"
          {...inputProps}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
