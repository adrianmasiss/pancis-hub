"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { messages } from "@/i18n/es-419";

type PasswordFieldProps = {
  label: string;
  error?: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, "type">;

/**
 * Campo de contrasena con boton de mostrar/ocultar embebido (desing-reference/
 * Pancis Login v4). El label es visible solo para lectores de pantalla: el
 * diseno de Acceso identifica el campo por su placeholder, no por un rotulo
 * encima.
 */
export function PasswordField({
  label,
  error,
  className,
  id: idProp,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2"
        />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-12 rounded-[12px] pr-12 pl-11"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible
              ? messages.auth.fields.hidePassword
              : messages.auth.fields.showPassword
          }
          title={
            visible
              ? messages.auth.fields.hidePassword
              : messages.auth.fields.showPassword
          }
          className="text-subtle-foreground hover:text-foreground hover:bg-card-raised absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-[9px] transition-colors"
        >
          {visible ? (
            <EyeOff className="size-[17px]" />
          ) : (
            <Eye className="size-[17px]" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
