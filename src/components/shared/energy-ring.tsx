import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RingStyle = CSSProperties & { "--ring-progress": string };

export function EnergyRing({
  value,
  target,
  children,
  className,
  label,
}: {
  value: number;
  target: number;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const progress = target > 0 ? Math.min(100, Math.max(0, value / target)) : 0;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "metric-ring relative grid shrink-0 place-items-center rounded-full",
        className,
      )}
      style={{ "--ring-progress": `${progress * 100}%` } as RingStyle}
    >
      <div className="relative z-[1] flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
