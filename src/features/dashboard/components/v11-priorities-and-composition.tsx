"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SinDato } from "@/components/shared/sin-dato";
import { V11Card } from "@/components/shared/v11-card";

type PriorityItem = {
  id: string;
  dotColor: string;
  title: string;
  description: string;
  meta: string;
  metaColor: string;
  href: string;
};

const DEFAULT_PRIORITIES: PriorityItem[] = [
  {
    id: "1",
    dotColor: "var(--positive)",
    title: "Sube la proteína del desayuno a 40 g",
    description:
      "Tercer día consecutivo por debajo del umbral en la franja de mañana. Hay una sustitución que lo cierra sin mover calorías.",
    meta: "Evidencia alta · Morton 2018 · 49 estudios",
    metaColor: "var(--positive)",
    href: "/nutricion",
  },
  {
    id: "2",
    dotColor: "var(--pc-brand-from, var(--primary))",
    title: "Cambia el press inclinado por la variante en máquina",
    description:
      "Recuperación de pectoral al 71 % con el volumen más alto del bloque. Conservas el 95 % del estímulo con 15 % menos de fatiga.",
    meta: "Confianza moderada · 6 estudios · EMG y carga",
    metaColor: "var(--pc-brand-from, var(--primary))",
    href: "/entrenamiento",
  },
  {
    id: "3",
    dotColor: "var(--muted-foreground)",
    title: "Separa las dos sesiones de pierna 72 h",
    description:
      "La recuperación de piernas cayó 9 puntos tras la sesión del miércoles. El volumen total no es el problema; la densidad sí.",
    meta: "Inferencia personalizada · 21 mediciones · confianza baja",
    metaColor: "var(--muted-foreground)",
    href: "/progreso",
  },
];

type V11PrioritiesCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
};

export function V11PrioritiesCard({ index = 0 }: V11PrioritiesCardProps) {
  return (
    <V11Card
      index={index}
      className="flex h-full flex-col justify-between p-6 sm:p-7"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
          Qué priorizar
        </h3>
        <span className="border-border/60 text-muted-foreground rounded-full border bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] px-3 py-0.5 text-[12px] shadow-sm">
          3 abiertas
        </span>
      </div>

      {/* Lista de recomendaciones con hover cinético */}
      <div className="divide-border/50 mt-5 flex flex-col divide-y">
        {DEFAULT_PRIORITIES.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group/item flex items-start justify-between gap-4 py-4 transition-colors first:pt-2 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: item.dotColor, color: item.dotColor }}
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1">
                <h4 className="text-foreground group-hover/item:text-foreground text-[14.5px] font-semibold transition-colors">
                  {item.title}
                </h4>
                <p className="text-muted-foreground text-[13px] leading-relaxed">
                  {item.description}
                </p>
                <span
                  className="mt-1 text-[11.5px] font-medium tracking-tight"
                  style={{ color: item.metaColor }}
                >
                  {item.meta}
                </span>
              </div>
            </div>

            {/* Trailing button en cápsula circular con micro-tensión */}
            <div className="border-border/60 text-muted-foreground group-hover/item:border-border/60 group-hover/item:text-foreground flex size-8 shrink-0 items-center justify-center rounded-full border bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] transition-[transform,background-color,border-color,color] duration-[240ms] ease-[var(--pc-ease-pop)] group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]">
              <ArrowUpRight className="size-4 stroke-[2.2]" />
            </div>
          </Link>
        ))}
      </div>
    </V11Card>
  );
}

type V11CompositionCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
  /**
   * El peso SI viene de una medida real; `null` significa que el usuario
   * todavia no tiene ninguna. Se escribe un guion en vez de heredar la
   * cifra del lienzo: una medida corporal inventada al lado de dos reales
   * no se distingue de un dato.
   */
  weight?: string | null;
  muscleMass?: string;
  bodyFat?: string;
  weightDelta?: string | null;
  muscleDelta?: string;
  fatDelta?: string;
};

export function V11CompositionCard({
  weight,
  muscleMass = "36,2 kg",
  bodyFat = "14,8 %",
  weightDelta,
  muscleDelta = "+0,9 kg",
  fatDelta = "-1,6 pts",
  index = 0,
}: V11CompositionCardProps) {
  return (
    <V11Card
      index={index}
      className="composition-card flex h-full flex-col p-6 sm:p-7"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-[15px] font-bold tracking-[-0.01em]">
          Composición
        </h3>
        <span className="border-border/60 text-muted-foreground rounded-full border bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] px-3 py-0.5 text-[12px] shadow-sm">
          Hoy
        </span>
      </div>

      {/* Métricas */}
      <div className="divide-border/50 mt-5 flex flex-col divide-y">
        <div className="flex items-baseline justify-between py-3 first:pt-1">
          <div>
            <span className="text-muted-foreground text-[13px]">Peso</span>
            <p className="text-subtle-foreground text-[11.5px]">
              {weightDelta ?? "sin medidas todavía"}
            </p>
          </div>
          <span className="num text-foreground text-[20px] font-semibold tracking-tight tabular-nums">
            {weight ?? <SinDato />}
          </span>
        </div>

        <div className="flex items-baseline justify-between py-3">
          <div>
            <span className="text-muted-foreground text-[13px]">
              Masa muscular
            </span>
            <p className="text-positive text-[11.5px] font-bold tabular-nums">
              {muscleDelta}
            </p>
          </div>
          <span className="text-foreground text-[20px] font-black tracking-tight tabular-nums">
            {muscleMass}
          </span>
        </div>

        <div className="flex items-baseline justify-between py-3 last:pb-1">
          <div>
            <span className="text-muted-foreground text-[13px]">
              Grasa corporal
            </span>
            <p className="text-positive text-[11.5px] font-bold tabular-nums">
              {fatDelta}
            </p>
          </div>
          <span className="text-foreground text-[20px] font-black tracking-tight tabular-nums">
            {bodyFat}
          </span>
        </div>
      </div>
    </V11Card>
  );
}
