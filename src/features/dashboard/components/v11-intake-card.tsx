"use client";
import { useId } from "react";
import { V11Card, V11CardHead, V11Chip } from "@/components/shared/v11-card";
import { formatNumber } from "@/lib/format/number";
import { useSweep } from "@/lib/motion/use-sweep";

type Props = {
  consumed: number;
  target: number;
  remaining: number;
  pct: number;
  index?: number;
};
export function V11IntakeCard({
  consumed,
  target,
  remaining,
  pct,
  index = 0,
}: Props) {
  const swept = useSweep();
  const gradient = useId();
  const shown = Math.max(0, Math.min(pct, 100));
  return (
    <V11Card index={index} className="intake-card v11-padded">
      <V11CardHead title="Ingesta" aside={<V11Chip>{shown} %</V11Chip>} />
      <div className="intake-ring">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="var(--chart-1)" />
              <stop offset="1" stopColor="var(--pc-chart-to)" />
            </linearGradient>
          </defs>
          <circle
            cx="70"
            cy="70"
            r="56"
            fill="none"
            stroke="var(--v11-track)"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r="61.5"
            fill="none"
            stroke="var(--v11-ring-edge)"
            strokeWidth="1.5"
          />
          <circle
            cx="70"
            cy="70"
            r="50.5"
            fill="none"
            stroke="var(--v11-ring-edge)"
            strokeWidth="1.5"
          />
          <circle
            cx="70"
            cy="70"
            r="56"
            fill="none"
            stroke={`url(#${gradient})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={351.86}
            strokeDashoffset={swept ? 351.86 * (1 - shown / 100) : 351.86}
            className="transition-[stroke-dashoffset] duration-[800ms] ease-[var(--pc-spring)]"
          />
        </svg>
        <div>
          <strong>{formatNumber(consumed)}</strong>
          <span>kcal de hoy</span>
        </div>
      </div>
      <div className="intake-stats">
        {[
          { label: "Restantes", value: remaining },
          { label: "Objetivo", value: target },
        ].map((stat) => (
          <div key={stat.label}>
            <span className="label-micro text-subtle-foreground">
              {stat.label}
            </span>
            <p>{formatNumber(stat.value)}</p>
          </div>
        ))}
      </div>
    </V11Card>
  );
}
