"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import "./form-kit.css";

type SelectFieldProps = {
  label: string;
  options: readonly { value: string; label: string }[];
  error?: string;
  help?: string;
  placeholder?: string;
} & React.ComponentProps<"select">;

/** Select nativo accesible con el estilo de los inputs de shadcn/ui. */
export function SelectField({
  label,
  options,
  error,
  help,
  placeholder,
  className,
  value,
  defaultValue,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  // El select es controlado (value) o no controlado (defaultValue), nunca
  // ambos a la vez: React lanza error si un <select> recibe los dos.
  const uncontrolledProps =
    value === undefined
      ? { defaultValue: defaultValue ?? (placeholder ? "" : undefined) }
      : { value };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : help ? helpId : undefined}
        className={cn(
          "pc-select border-input bg-card/75 dark:bg-card-raised/60 h-11 w-full min-w-0 appearance-none rounded-xl border py-1 pr-10 pl-3.5 text-base outline-none md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...uncontrolledProps}
        {...selectProps}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help && !error ? (
        <p id={helpId} className="text-muted-foreground text-xs">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
