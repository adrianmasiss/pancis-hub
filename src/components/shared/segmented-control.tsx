"use client";

import "./pill-controls.css";
import { useId, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

export type SegmentOption<T extends string> = {
  id: T;
  /** Accessible name; kept stable because tests and screen readers use it. */
  label: string;
  /** What the segment shows, when it differs from the label. */
  short?: string;
  icon?: ReactNode;
  /** Show only the icon (the label stays as the accessible name). */
  iconOnly?: boolean;
};

/**
 * One choice among a few, as a black track with a graphite thumb that slides
 * to the active segment on a critically damped spring: it retargets mid-way
 * if you change your mind, and never overshoots. Reduced motion: it jumps.
 */
export function SegmentedControl<T extends string>({
  options,
  active,
  onSelect,
  disabled,
  className = "",
}: {
  options: SegmentOption<T>[];
  active: T;
  onSelect: (id: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const group = useId();
  const reduced = useReducedMotion();
  return (
    <LayoutGroup id={group}>
      <div className={`cmp-segmented ${className}`}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="cmp-segment"
            data-icon={option.iconOnly ? "" : undefined}
            title={option.label}
            aria-label={option.label}
            aria-pressed={active === option.id}
            disabled={disabled}
            onClick={() => onSelect(option.id)}
          >
            {active === option.id && (
              <motion.span
                layoutId="thumb"
                className="cmp-segment-thumb"
                aria-hidden="true"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", bounce: 0, duration: 0.38 }
                }
              />
            )}
            <span className="cmp-segment-label">
              {option.icon}
              {!option.iconOnly && (option.short ?? option.label)}
            </span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
