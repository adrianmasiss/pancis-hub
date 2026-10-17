"use client";

import "./alternative-row.css";
import { Check, ChevronRight } from "lucide-react";
import { FoodMedia } from "@/features/nutrition/components/swap-comparison-board";

/**
 * One option to swap to, as a list row rather than a card: the picker is
 * already the card, and a card inside it would be one surface too many.
 * A small round portrait (the same one the comparison cards use), the name,
 * the portion, and the one number worth comparing at a glance: how many
 * calories it moves against what you have.
 */
export function AlternativeRow({
  name,
  meta,
  group,
  imageUrl,
  cookedState,
  deltaKcal,
  featured,
  pressed,
  disabled,
  onClick,
}: {
  name: string;
  meta: string;
  group?: string | null;
  imageUrl?: string | null;
  cookedState?: string | null;
  /** Alternative minus current, in kcal; omitted when there is no current. */
  deltaKcal?: number | null;
  /** The closest match; it says so. */
  featured?: boolean;
  /** The one already chosen. */
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const delta =
    deltaKcal === null || deltaKcal === undefined
      ? null
      : Math.round(deltaKcal);
  return (
    <button
      type="button"
      // `alternative-option` stays as a hook for the e2e suite.
      className="alt-row alternative-option"
      data-featured={featured || undefined}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="alt-row-media">
        <FoodMedia
          name={name}
          group={group}
          imageUrl={imageUrl}
          cookedState={cookedState}
        />
      </span>
      <span className="alt-row-text">
        <strong title={name}>{name}</strong>
        <small>
          {featured && <em className="alt-row-tag">Más parecida</em>}
          <span className="alt-row-meta">{meta}</span>
        </small>
      </span>
      {delta !== null && (
        <span
          className="alt-row-delta"
          data-zero={delta === 0 || undefined}
          aria-label={`${delta > 0 ? "+" : ""}${delta} kcal frente a tu alimento`}
        >
          {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
          {Math.abs(delta)}
          <small> kcal</small>
        </span>
      )}
      <span className="alt-row-go" aria-hidden="true">
        {pressed ? (
          <Check size={15} strokeWidth={2} />
        ) : (
          <ChevronRight size={16} strokeWidth={1.75} />
        )}
      </span>
    </button>
  );
}
