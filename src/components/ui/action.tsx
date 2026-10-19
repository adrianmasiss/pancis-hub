"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Check,
  Hourglass,
  Pencil,
  Plus,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpandActionInner } from "./expand-action";
import "./action.css";

type ActionFamily = "add" | "save" | "edit";
type ActionIcon = "save" | "confirm" | "edit" | "swap";
type ActionAppearance = {
  family: ActionFamily;
  icon?: ActionIcon;
  compact?: boolean;
  compactOnMobile?: boolean;
  children?: ReactNode;
};

function ActionContent({
  family,
  icon,
  children,
  loading = false,
}: ActionAppearance & { loading?: boolean }) {
  const Icon = loading
    ? Hourglass
    : family === "add"
      ? Plus
      : icon === "confirm"
        ? Check
        : icon === "swap"
          ? ArrowLeftRight
          : family === "edit"
            ? Pencil
            : Save;
  const mark = <Icon />;
  if (family === "save")
    return <ExpandActionInner icon={mark} label={children} />;
  return (
    <>
      <span className="pc-action-disc" aria-hidden="true">
        <span className="pc-action-glyph">{mark}</span>
        {family === "edit" && !loading && (
          <span className="pc-action-copy">{mark}</span>
        )}
      </span>
      <span className="pc-action-label">{children}</span>
    </>
  );
}

/** Explicit semantic families: never infer intent from translated labels. */
export function ActionButton({
  family,
  icon,
  compact = false,
  compactOnMobile = false,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & ActionAppearance & { loading?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || props["aria-busy"] || undefined}
      data-family={family}
      data-compact={compact || undefined}
      data-compact-on-mobile={compactOnMobile || undefined}
      className={cn(
        "pc-action",
        family === "save" && "expand-action",
        className,
      )}
    >
      <ActionContent family={family} icon={icon} loading={loading}>
        {children}
      </ActionContent>
    </button>
  );
}

/** Navigation keeps Next Link semantics and supports the same visual families. */
export function ActionLink({
  family,
  icon,
  compact = false,
  compactOnMobile = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & ActionAppearance) {
  return (
    <Link
      {...props}
      data-family={family}
      data-compact={compact || undefined}
      data-compact-on-mobile={compactOnMobile || undefined}
      className={cn(
        "pc-action",
        family === "save" && "expand-action",
        className,
      )}
    >
      <ActionContent family={family} icon={icon}>
        {children}
      </ActionContent>
    </Link>
  );
}
