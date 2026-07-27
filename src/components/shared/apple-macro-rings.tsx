"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { triggerHaptic } from "@/lib/haptics";
import { useSafeTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MacroData = {
  consumed: number;
  target: number;
  unit: string;
};

type MacroRingsProps = {
  calories: MacroData;
  protein: MacroData;
  carbs: MacroData;
  fat: MacroData;
  size?: number;
  className?: string;
};

/**
 * Anillos concentricos de macronutrientes.
 *
 * Los colores salen de la paleta categorica del sistema (--chart-*), que es un
 * recorrido calido -> frio dentro de la misma familia: distinguible tambien en
 * escala de grises y sin introducir un segundo esquema cromatico. La leyenda
 * nombra cada anillo, de modo que el color nunca es el unico portador del dato.
 */
export function AppleMacroRings({
  calories,
  protein,
  carbs,
  fat,
  size = 200,
  className,
}: MacroRingsProps) {
  const [activeRing, setActiveRing] = useState<
    "protein" | "carbs" | "fat" | null
  >(null);

  // El trazado de los anillos es decorativo: el dato ya esta en el centro y en
  // la leyenda. Si el sistema pide reducir movimiento, se pinta el valor final.
  const drawTransition = useSafeTransition({
    duration: 0.6,
    ease: [0.22, 0.61, 0.36, 1],
  });
  const shouldDraw = drawTransition.duration !== 0;

  const strokeWidth = 10;
  const gap = 6;
  const center = size / 2;

  const rProtein = center - strokeWidth / 2 - 4;
  const rCarbs = rProtein - strokeWidth - gap;
  const rFat = rCarbs - strokeWidth - gap;

  const getPercentage = (consumed: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.min(Math.max(consumed / target, 0), 1);
  };

  const ringConfigs = [
    {
      id: "protein" as const,
      label: "Proteínas",
      radius: rProtein,
      pct: getPercentage(protein.consumed, protein.target),
      data: protein,
      color: "var(--chart-2)",
    },
    {
      id: "carbs" as const,
      label: "Carbohidratos",
      radius: rCarbs,
      pct: getPercentage(carbs.consumed, carbs.target),
      data: carbs,
      color: "var(--chart-3)",
    },
    {
      id: "fat" as const,
      label: "Grasas",
      radius: rFat,
      pct: getPercentage(fat.consumed, fat.target),
      data: fat,
      color: "var(--chart-4)",
    },
  ];

  const activeInfo = activeRing
    ? ringConfigs.find((r) => r.id === activeRing)
    : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center select-none",
        className,
      )}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {ringConfigs.map((r) => {
            const circumference = 2 * Math.PI * r.radius;
            const strokeDashoffset = circumference * (1 - r.pct);

            return (
              <g key={r.id} className="cursor-pointer">
                <circle
                  cx={center}
                  cy={center}
                  r={r.radius}
                  // --muted casi desaparece sobre el grafito. Una mezcla con
                  // el color de texto se sostiene igual en claro y en oscuro.
                  stroke="color-mix(in oklch, var(--foreground) 11%, transparent)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <motion.circle
                  cx={center}
                  cy={center}
                  r={r.radius}
                  stroke={r.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  initial={
                    shouldDraw ? { strokeDashoffset: circumference } : false
                  }
                  animate={{ strokeDashoffset }}
                  transition={drawTransition}
                  opacity={activeRing && activeRing !== r.id ? 0.35 : 1}
                  onMouseEnter={() => setActiveRing(r.id)}
                  onMouseLeave={() => setActiveRing(null)}
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveRing(activeRing === r.id ? null : r.id);
                  }}
                />
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-6 text-center">
          {activeInfo ? (
            <>
              <p className="label-micro">{activeInfo.label}</p>
              <p className="num text-xl leading-none font-medium">
                {activeInfo.data.consumed}
                <span className="text-muted-foreground ml-1 text-xs">
                  / {activeInfo.data.target}
                  {activeInfo.data.unit}
                </span>
              </p>
              <p className="text-muted-foreground text-[0.6875rem]">
                <span className="num">{Math.round(activeInfo.pct * 100)}%</span>{" "}
                de tu meta
              </p>
            </>
          ) : (
            <>
              <p className="label-micro">Calorías</p>
              <p className="num text-2xl leading-none font-medium">
                {calories.consumed}
              </p>
              <p className="text-muted-foreground text-[0.6875rem]">
                de <span className="num">{calories.target}</span>{" "}
                {calories.unit}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Con las cifras dentro, la leyenda deja de caber en una fila: pasa a
          columna, alineada a la izquierda, para que los numeros se comparen
          verticalmente. */}
      <div className="mt-5 flex w-full max-w-[15rem] flex-col gap-2">
        {ringConfigs.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveRing(activeRing === r.id ? null : r.id);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm text-xs transition-colors duration-200",
              activeRing === r.id
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: r.color }}
              aria-hidden="true"
            />
            {r.label}
            {/* La cifra vive aqui, junto al color que le corresponde. Antes se
                repetia en un bloque de barras aparte: el mismo dato dos veces
                en la misma tarjeta, y ganaba el bloque que traia numeros. */}
            <span className="num text-muted-foreground ml-auto shrink-0">
              <span className="text-foreground">{r.data.consumed}</span>/
              {r.data.target}
              {r.data.unit}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
