"use client";

import { useState } from "react";
import { ArrowLeftRight, ChevronDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { V11Card } from "@/components/shared/v11-card";

type V11FoodCompareCardProps = {
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
};

export function V11FoodCompareCard({ index = 0 }: V11FoodCompareCardProps) {
  const [swapped, setSwapped] = useState(false);

  const foodA = swapped
    ? {
        name: "Pechuga de pollo",
        origin: "BIBLIOTECA DE ALIMENTOS",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sodium: 74,
      }
    : {
        name: "Salmón",
        origin: "EN TU DIETA DE HOY",
        calories: 208,
        protein: 20,
        carbs: 0,
        fat: 13,
        fiber: 0,
        sodium: 59,
      };

  const foodB = swapped
    ? {
        name: "Salmón",
        origin: "EN TU DIETA DE HOY",
        calories: 208,
        protein: 20,
        carbs: 0,
        fat: 13,
        fiber: 0,
        sodium: 59,
      }
    : {
        name: "Pechuga de pollo",
        origin: "BIBLIOTECA DE ALIMENTOS",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sodium: 74,
      };

  const handleSubstitute = () => {
    toast.info(
      "Esta comparación es de muestra. Abre tu plan para confirmar una sustitución real.",
    );
  };

  return (
    <V11Card index={index} className="food-compare group p-6 sm:p-8">
      {/* Filete especular superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      {/* Header con botón intercambiar */}
      <div className="flex items-center justify-between">
        <div className="text-foreground flex items-center gap-2 text-[14px] font-bold">
          <ArrowUpDown className="text-muted-foreground size-4" />
          <span>Comparar alimentos</span>
        </div>

        <button
          type="button"
          onClick={() => setSwapped(!swapped)}
          className="border-border/60 text-muted-foreground hover:border-border/60 hover:text-foreground inline-flex items-center gap-1.5 rounded-full border bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-3.5 py-1.5 text-[12.5px] font-medium shadow-sm transition-[background-color,border-color,color] duration-[160ms] ease-linear hover:bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] active:scale-95"
        >
          <ArrowLeftRight className="size-3.5" />
          <span>Intercambiar</span>
        </button>
      </div>

      {/* Sección de Comparación en 3 columnas */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        {/* Columna Izquierda: Alimento A */}
        <div className="border-border/60 bg-background flex flex-col items-center rounded-2xl border p-5 shadow-inner">
          <div className="border-border/60 flex w-full items-center justify-between rounded-xl border bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[color-mix(in_oklab,var(--foreground)_28%,transparent)]" />
              <div className="flex flex-col text-left">
                <span className="text-foreground text-[13.5px] font-bold">
                  {foodA.name}
                </span>
                <span className="text-subtle-foreground text-[9.5px] font-bold tracking-wider uppercase">
                  {foodA.origin}
                </span>
              </div>
            </div>
            <ChevronDown className="text-subtle-foreground size-4" />
          </div>

          {/* Donut Chart bicolor */}
          <div className="relative my-6 flex size-36 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="var(--pc-brand-from, var(--primary))"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset="125"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="var(--positive)"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset="180"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-foreground text-[26px] leading-none font-black tracking-tight">
                {foodA.calories}
              </span>
              <span className="text-subtle-foreground mt-1 text-[9px] font-bold tracking-wider uppercase">
                kcal / 100 g
              </span>
            </div>
          </div>

          {/* Desglose de macros */}
          <div className="border-border/60 w-full space-y-2 border-t pt-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-positive size-1.5 rounded-full" /> Proteína
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodA.protein} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[color-mix(in_oklab,var(--foreground)_28%,transparent)]" />{" "}
                Carbohidrato
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodA.carbs} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-primary size-1.5 rounded-full" /> Grasa
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodA.fat} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-subtle-foreground size-1.5 rounded-full" />{" "}
                Fibra
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodA.fiber} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-subtle-foreground size-1.5 rounded-full" />{" "}
                Sodio
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodA.sodium} mg
              </span>
            </div>
          </div>
        </div>

        {/* Columna Central: Columna de Diferencia */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-subtle-foreground text-[10px] font-bold tracking-widest uppercase">
            Diferencia
          </span>

          <div className="border-border/60 bg-background w-28 rounded-xl border p-2 text-center shadow-inner">
            <span className="text-positive text-[15px] font-bold tabular-nums">
              -43
            </span>
            <span className="text-subtle-foreground block text-[10px]">
              kcal
            </span>
          </div>

          <div className="border-border/60 bg-background w-28 rounded-xl border p-2 text-center shadow-inner">
            <span className="text-positive text-[15px] font-bold tabular-nums">
              +11 g
            </span>
            <span className="text-subtle-foreground block text-[10px]">
              Proteína
            </span>
          </div>

          <div className="border-border/60 bg-background w-28 rounded-xl border p-2 text-center shadow-inner">
            <span className="text-muted-foreground text-[15px] font-bold">
              =
            </span>
            <span className="text-subtle-foreground block text-[10px]">
              Carbohidrato
            </span>
          </div>

          <div className="border-border/60 bg-background w-28 rounded-xl border p-2 text-center shadow-inner">
            <span className="text-positive text-[15px] font-bold tabular-nums">
              -9.4 g
            </span>
            <span className="text-subtle-foreground block text-[10px]">
              Grasa
            </span>
          </div>

          <div className="border-border/60 bg-background w-28 rounded-xl border p-2 text-center shadow-inner">
            <span className="text-muted-foreground text-[15px] font-bold">
              =
            </span>
            <span className="text-subtle-foreground block text-[10px]">
              Fibra
            </span>
          </div>
        </div>

        {/* Columna Derecha: Alimento B */}
        <div className="border-border/60 bg-background flex flex-col items-center rounded-2xl border p-5 shadow-inner">
          <div className="border-border/60 flex w-full items-center justify-between rounded-xl border bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="bg-positive size-2 rounded-full" />
              <div className="flex flex-col text-left">
                <span className="text-foreground text-[13.5px] font-bold">
                  {foodB.name}
                </span>
                <span className="text-subtle-foreground text-[9.5px] font-bold tracking-wider uppercase">
                  {foodB.origin}
                </span>
              </div>
            </div>
            <ChevronDown className="text-subtle-foreground size-4" />
          </div>

          {/* Donut Chart bicolor */}
          <div className="relative my-6 flex size-36 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="var(--positive)"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset="75"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="var(--pc-brand-from, var(--primary))"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset="210"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-foreground text-[26px] leading-none font-black tracking-tight">
                {foodB.calories}
              </span>
              <span className="text-subtle-foreground mt-1 text-[9px] font-bold tracking-wider uppercase">
                kcal / 100 g
              </span>
            </div>
          </div>

          {/* Desglose de macros */}
          <div className="border-border/60 w-full space-y-2 border-t pt-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-positive size-1.5 rounded-full" /> Proteína
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodB.protein} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[color-mix(in_oklab,var(--foreground)_28%,transparent)]" />{" "}
                Carbohidrato
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodB.carbs} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-primary size-1.5 rounded-full" /> Grasa
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodB.fat} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-subtle-foreground size-1.5 rounded-full" />{" "}
                Fibra
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodB.fiber} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="bg-subtle-foreground size-1.5 rounded-full" />{" "}
                Sodio
              </span>
              <span className="text-foreground font-bold tabular-nums">
                {foodB.sodium} mg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Nota de conclusión y Botón de Sustitución */}
      <div className="border-border/60 mt-8 flex flex-col items-center justify-between gap-4 border-t pt-5 sm:flex-row">
        <p className="text-muted-foreground text-center text-[13.5px] sm:text-left">
          <strong className="text-foreground font-semibold">
            Pechuga de pollo
          </strong>{" "}
          aporta 11 g más de proteína por 100 g con 43 kcal menos.
        </p>

        <button
          type="button"
          onClick={handleSubstitute}
          className="bg-primary text-background hover:bg-primary-strong inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 text-[13.5px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition-[background-color,box-shadow] duration-[160ms] ease-linear hover:shadow-[0_0_20px_rgba(252,234,210,0.3)] active:scale-[0.98]"
        >
          Sustituir en el plan
        </button>
      </div>
    </V11Card>
  );
}
