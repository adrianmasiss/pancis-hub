"use client";

import "./pill-controls.css";
import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { SegmentedControl } from "./segmented-control";

export type ComparisonMode<T extends string> = {
  id: T;
  /** Accessible name; kept stable because tests and screen readers use it. */
  label: string;
  /** What the segment shows, when it differs from the label. */
  short?: string;
  icon?: "search";
};

/**
 * How to find the alternative, as one control instead of four loose
 * buttons. The ways of browsing are a single choice, so they share one
 * segmented track (SegmentedControl). Adding a food is a different kind of
 * action and stands apart as its own round button. The way back, when there
 * is one, leads the row.
 */
export function ComparisonToolbar<T extends string>({
  label,
  modes,
  active,
  onSelect,
  disabled,
  leading,
  add,
}: {
  label: string;
  modes: ComparisonMode<T>[];
  active: T;
  onSelect: (id: T) => void;
  disabled?: boolean;
  leading?: ReactNode;
  /** The add action: a trigger element, or a handler for the default one. */
  add: ReactNode | (() => void);
}) {
  return (
    <div
      className="comparison-discovery-toolbar cmp-toolbar"
      role="group"
      aria-label={label}
    >
      {leading}
      <SegmentedControl
        options={modes.map((mode) => ({
          ...mode,
          icon:
            mode.icon === "search" ? (
              <Search size={17} strokeWidth={1.75} aria-hidden="true" />
            ) : undefined,
          iconOnly: mode.icon === "search",
        }))}
        active={active}
        onSelect={onSelect}
        disabled={disabled}
      />
      {typeof add === "function" ? (
        <AddFoodButton onClick={add} disabled={disabled} />
      ) : (
        add
      )}
    </div>
  );
}

/** The round add button; also used as the food dialog's trigger. */
export function AddFoodButton(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="cmp-add"
      aria-label="Agregar alimento"
      title="Agregar alimento"
      {...props}
    >
      <Plus size={19} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
