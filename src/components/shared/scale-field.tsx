"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type ScaleFieldProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
};

/** Escala 1-5 como control segmentado accesible (radios nativos). */
export function ScaleField({ label, value, onChange }: ScaleFieldProps) {
  const name = useId();

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-5 gap-1" role="radiogroup">
        {[1, 2, 3, 4, 5].map((option) => (
          <label
            key={option}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors",
              value === option
                ? "bg-brand-button text-primary-foreground border-transparent"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
