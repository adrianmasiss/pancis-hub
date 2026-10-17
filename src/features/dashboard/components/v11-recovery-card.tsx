"use client";
import { useId } from "react";
import Link from "next/link";
import { V11Card, V11CardHead, V11Chip } from "@/components/shared/v11-card";
import { useSweep } from "@/lib/motion/use-sweep";
export function V11RecoveryCard({
  score = 86,
  time = "InBody 07:10",
  focusMuscle = "Pectoral",
  focusScore = 71,
  detailHref = "/progreso",
  index = 0,
}: {
  score?: number;
  time?: string;
  focusMuscle?: string;
  focusScore?: number;
  detailHref?: string;
  index?: number;
}) {
  const swept = useSweep(),
    gradient = useId();
  return (
    <V11Card index={index} className="recovery-card v11-padded">
      <V11CardHead title="Recuperación" aside={<V11Chip>{time}</V11Chip>} />
      <div className="recovery-gauge">
        <svg viewBox="0 0 160 108" aria-hidden="true">
          <defs>
            <linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
              <stop stopColor="var(--caution)" />
              <stop offset="1" stopColor="var(--positive)" />
            </linearGradient>
          </defs>
          <path
            d="M22 96 A58 58 0 1 1 138 96"
            fill="none"
            stroke="var(--v11-track)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M22 96 A58 58 0 1 1 138 96"
            fill="none"
            stroke={`url(#${gradient})`}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={273}
            strokeDashoffset={
              swept ? 273 * (1 - Math.min(100, Math.max(0, score)) / 100) : 273
            }
            className="transition-[stroke-dashoffset] duration-[600ms] ease-[var(--pc-spring)]"
          />
        </svg>
        <div>
          <strong>
            {score} <span>%</span>
          </strong>
          <small>recuperación global</small>
        </div>
      </div>
      <div className="recovery-footer">
        <span>
          {focusMuscle} al {focusScore} %
        </span>
        <Link href={detailHref} data-glow className="v11-button">
          Ver detalle
        </Link>
      </div>
    </V11Card>
  );
}
