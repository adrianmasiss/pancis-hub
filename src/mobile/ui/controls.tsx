"use client";

import { useId } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { triggerHaptic } from "@/lib/haptics";
import { Haptic } from "./haptic";

/** Interruptor con `role="switch"` y rebote en la perilla. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="m-switch"
      onClick={() => {
        triggerHaptic("light");
        onCheckedChange(!checked);
      }}
    >
      <Haptic />
      <span className="m-switch-knob" aria-hidden="true" />
    </button>
  );
}

/** Stepper ±: resta y suma `step`, con la unidad pequeña junto a la cifra. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  unit,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  label: string;
}) {
  return (
    <div className="m-stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Restar ${step}${unit ? ` ${unit}` : ""}`}
        disabled={value - step < min}
        onClick={() => {
          triggerHaptic("selection");
          onChange(Math.max(min, value - step));
        }}
      >
        <Haptic />
        <Minus size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="m-stepper-value" aria-live="polite">
        {value}
        {unit ? <small>{unit}</small> : null}
      </span>
      <button
        type="button"
        aria-label={`Sumar ${step}${unit ? ` ${unit}` : ""}`}
        disabled={value + step > max}
        onClick={() => {
          triggerHaptic("selection");
          onChange(Math.min(max, value + step));
        }}
      >
        <Haptic />
        <Plus size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Check circular de 44–48px: serie hecha, comida marcada. El relleno del
 * acento entra con rebote.
 */
export function CheckCircle({
  checked,
  onToggle,
  label,
  current,
  size = "md",
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  current?: boolean;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      data-current={current && !checked ? "" : undefined}
      data-size={size === "sm" ? "sm" : undefined}
      className="m-check"
      onClick={() => {
        triggerHaptic(checked ? "light" : "medium");
        onToggle();
      }}
    >
      <Haptic />
      <Check size={20} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

/** Segmentado con el fondo del activo deslizandose. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  tone,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
  /** `accent`: el activo en el acento (Progreso). Por defecto, gris. */
  tone?: "accent";
}) {
  const reduce = useReducedMotion();
  const id = useId();
  return (
    <div className="m-seg" role="group" aria-label={label} data-tone={tone}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            className="m-seg-item"
            onClick={() => {
              if (!active) triggerHaptic("selection");
              onChange(o.value);
            }}
          >
            <Haptic />
            {active && (
              <motion.span
                layoutId={`m-seg-${id}`}
                className="m-seg-thumb"
                aria-hidden="true"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", bounce: 0, duration: 0.35 }
                }
              />
            )}
            <span className="m-seg-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
