"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { messages } from "@/i18n/es-419";

type PasswordFieldProps = {
  label: string;
  error?: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, "type">;

/**
 * Contrasena, con la misma anatomia que `IconField`: rotulo visible encima,
 * marco en el envoltorio, icono y boton de ver/ocultar DENTRO del marco.
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
  const rotulo = visible
    ? messages.auth.fields.hidePassword
    : messages.auth.fields.showPassword;

  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id} className="field-label">
        {label}
      </Label>
      <div className="field-shell" data-invalid={error ? true : undefined}>
        <Lock aria-hidden="true" className="size-[18px]" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={rotulo}
          title={rotulo}
          className="field-reveal"
        >
          {visible ? (
            <EyeOff className="size-[17px]" />
          ) : (
            <Eye className="size-[17px]" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
