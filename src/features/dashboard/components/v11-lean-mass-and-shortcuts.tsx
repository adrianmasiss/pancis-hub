"use client";

import Link from "next/link";
import {
  Utensils,
  Dumbbell,
  User,
  BookOpen,
  ArrowLeftRight,
  FileText,
} from "lucide-react";
import { V11Card } from "@/components/shared/v11-card";

type V11LeanMassCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
  value?: string;
  delta?: string;
  period?: string;
};

export function V11LeanMassCard({
  value = "36,2",
  delta = "+0,9 kg",
  period = "12 semanas",
  index = 0,
}: V11LeanMassCardProps) {
  return (
    <V11Card
      index={index}
      className="flex h-full flex-col justify-between p-6 sm:p-7"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
          Masa magra
        </h3>
        <span className="border-border/60 text-muted-foreground rounded-full border bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] px-3 py-0.5 text-[12px] shadow-sm">
          {period}
        </span>
      </div>

      {/* Cifra y delta */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-foreground text-[34px] leading-none font-black tracking-[-0.03em] tabular-nums">
          {value}
        </span>
        <span className="text-muted-foreground text-[15px] font-semibold">
          kg
        </span>
        <span className="text-positive ml-1 text-[13px] font-bold tabular-nums">
          {delta}
        </span>
      </div>

      {/* Gráfico lineal de tendencia ascendente con degradado vertical */}
      <div
        className="relative mt-6 h-20 w-full overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 400 80"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="leanGradHighEnd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.3" />
              <stop
                offset="100%"
                stopColor="var(--chart-1)"
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>
          <path
            d="M 0 65 Q 80 62, 140 55 T 260 40 T 400 15 L 400 80 L 0 80 Z"
            fill="url(#leanGradHighEnd)"
          />
          <path
            d="M 0 65 Q 80 62, 140 55 T 260 40 T 400 15"
            stroke="var(--chart-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_color-mix(in_oklab,var(--pc-brand-from,var(--primary))_40%,transparent)]"
          />
        </svg>
      </div>
    </V11Card>
  );
}

const SHORTCUTS = [
  { label: "Comida", icon: Utensils, href: "/nutricion" },
  { label: "Sesión", icon: Dumbbell, href: "/entrenamiento" },
  { label: "InBody", icon: User, href: "/progreso" },
  { label: "Evidencia", icon: BookOpen, href: "/evidencia" },
  { label: "Sustituir", icon: ArrowLeftRight, href: "/nutricion" },
  { label: "Notas", icon: FileText, href: "/asistente" },
];

type V11ShortcutsCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
};

export function V11ShortcutsCard({ index = 0 }: V11ShortcutsCardProps) {
  return (
    <V11Card
      index={index}
      className="flex h-full flex-col justify-between p-6 sm:p-7"
    >
      <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
        Accesos
      </h3>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              data-glow
              key={item.label}
              href={item.href}
              className="group/sc border-border/60 hover:border-border/60 flex flex-col items-center justify-center gap-2 rounded-[16px] border bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] p-3 text-center transition-[background-color,border-color,box-shadow] duration-[160ms] ease-linear hover:bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] hover:shadow-lg active:scale-[0.96]"
            >
              <div className="text-muted-foreground group-hover/sc:bg-primary group-hover/sc:text-primary-foreground flex size-8 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] transition-[background-color,border-color,color] duration-[160ms] ease-linear">
                <Icon className="size-4" strokeWidth={1.8} />
              </div>
              <span className="text-muted-foreground group-hover/sc:text-foreground text-[12px] font-medium transition-colors">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </V11Card>
  );
}
