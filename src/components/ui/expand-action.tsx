import type { ReactNode } from "react";
import "./expand-action.css";

/** Shared interior for save/confirm actions. Text stays in the accessibility tree. */
export function ExpandActionInner({
  icon,
  label,
}: {
  icon: ReactNode;
  label: ReactNode;
}) {
  return (
    <>
      <span className="expand-action-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="expand-action-text">{label}</span>
    </>
  );
}
