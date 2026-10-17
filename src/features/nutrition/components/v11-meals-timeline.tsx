"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MealTimelineItem = {
  id: string;
  time: string;
  name: string;
  status: "registrada" | "pendiente";
  foods: string;
  pctOfDay: number;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
};

const DEFAULT_TIMELINE_MEALS: MealTimelineItem[] = [
  {
    id: "desayuno",
    time: "07:30",
    name: "Desayuno",
    status: "registrada",
    foods: "Avena, claras y arándanos",
    pctOfDay: 21,
    calories: 520,
    macros: { protein: 42, carbs: 65, fat: 10 },
  },
  {
    id: "media-manana",
    time: "11:00",
    name: "Media mañana",
    status: "registrada",
    foods: "Yogur griego y nueces",
    pctOfDay: 11,
    calories: 280,
    macros: { protein: 22, carbs: 12, fat: 16 },
  },
  {
    id: "comida",
    time: "14:00",
    name: "Comida",
    status: "registrada",
    foods: "Pollo, arroz y ensalada de hoja verde",
    pctOfDay: 29,
    calories: 720,
    macros: { protein: 55, carbs: 80, fat: 18 },
  },
  {
    id: "merienda",
    time: "17:30",
    name: "Merienda",
    status: "registrada",
    foods: "Batido de proteína y plátano",
    pctOfDay: 13,
    calories: 310,
    macros: { protein: 32, carbs: 38, fat: 4 },
  },
  {
    id: "cena",
    time: "21:00",
    name: "Cena",
    status: "pendiente",
    foods: "Salmón, quinoa y brócoli",
    pctOfDay: 26,
    calories: 640,
    macros: { protein: 38, carbs: 65, fat: 30 },
  },
];

export function V11MealsTimeline({
  initialMeals = DEFAULT_TIMELINE_MEALS,
  index = 0,
}: {
  initialMeals?: MealTimelineItem[];
  /** Posicion en la entrada escalonada de la pantalla. */
  index?: number;
}) {
  const [meals, setMeals] = useState<MealTimelineItem[]>(initialMeals);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleStatus = (id: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: m.status === "registrada" ? "pendiente" : "registrada",
            }
          : m,
      ),
    );
  };

  return (
    <div
      className="meals-timeline"
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Filete especular superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex flex-col">
        {meals.map((meal, index) => {
          const isRegistered = meal.status === "registrada";
          const isExpanded = expandedId === meal.id;
          const isLast = index === meals.length - 1;

          return (
            <div key={meal.id} className="relative flex flex-col">
              <div className="meal-row">
                {/* Izquierda: Hora, Nodo y Nombre */}
                <div className="meal-identity">
                  {/* Timestamp */}
                  <span className="text-muted-foreground w-12 shrink-0 font-mono text-[12.5px] tabular-nums">
                    {meal.time}
                  </span>

                  {/* Nodo de la línea temporal */}
                  <div className="relative flex items-center justify-center">
                    <span
                      className={cn(
                        "size-3 rounded-full transition-colors",
                        isRegistered
                          ? "bg-positive shadow-[0_0_8px_color-mix(in_oklab,var(--positive)_50%,transparent)]"
                          : "border-muted-foreground bg-background border-2",
                      )}
                    />
                    {!isLast && (
                      <span
                        className="absolute top-3.5 left-1/2 h-12 w-px -translate-x-1/2 bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Título y alimentos */}
                  <div className="flex min-w-0 flex-col">
                    <div className="meal-name">
                      <span className="text-foreground text-[15px] font-bold">
                        {meal.name}
                      </span>
                      <span
                        className={cn(
                          "meal-status",
                          isRegistered
                            ? "text-muted-foreground bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]"
                            : "text-caution bg-[color-mix(in_oklab,var(--caution)_20%,transparent)]",
                        )}
                      >
                        {meal.status}
                      </span>
                    </div>
                    <span className="text-muted-foreground truncate text-[13px]">
                      {meal.foods}
                    </span>
                  </div>
                </div>

                {/* Centro: Barras de proporción y porcentaje (en desktop) */}
                <div className="meal-proportions">
                  <div className="flex items-center gap-1">
                    <div
                      className="bg-positive h-1.5 w-6 rounded-full"
                      title="Proteína"
                    />
                    <div
                      className="bg-primary h-1.5 w-8 rounded-full"
                      title="Carbohidrato"
                    />
                    <div
                      className="h-1.5 w-5 rounded-full bg-[var(--pc-brand-from,var(--primary))]"
                      title="Grasa"
                    />
                  </div>
                  <span className="text-subtle-foreground text-[11px] font-medium tracking-wider uppercase">
                    {meal.pctOfDay} % del día
                  </span>
                </div>

                {/* Derecha: Calorías, Chevron y Switch Toggle */}
                <div className="meal-actions">
                  <div className="flex items-baseline gap-1 tabular-nums">
                    <span className="text-foreground text-[18px] font-extrabold sm:text-[20px]">
                      {meal.calories}
                    </span>
                    <span className="text-subtle-foreground text-[12px]">
                      kcal
                    </span>
                  </div>

                  {/* Botón desplegable */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : meal.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Plegar" : "Ver"} alimentos de ${meal.name}`}
                    className="meal-expand text-subtle-foreground hover:text-foreground flex size-7 items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]"
                    title={isExpanded ? "Plegar detalles" : "Ver alimentos"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>

                  {/* Toggle Switch táctil */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(meal.id)}
                    role="switch"
                    aria-checked={isRegistered}
                    className={cn(
                      "focus-visible:outline-primary relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-4",
                      isRegistered
                        ? "bg-positive"
                        : "bg-[color-mix(in_oklab,var(--foreground)_15%,transparent)]",
                    )}
                    aria-label={`Marcar ${meal.name} como ${isRegistered ? "pendiente" : "registrada"}`}
                  >
                    <span
                      className={cn(
                        // El pomo del interruptor es el UNICO blanco fijo que queda, y con
                        // motivo: es un objeto fisico claro en los dos modos, como el
                        // de iOS. Su marca va en un oscuro constante, no en
                        // `--background`, que en claro es gris y desaparecia sobre el
                        // propio pomo.
                        "pointer-events-none flex size-5 transform items-center justify-center rounded-full bg-white text-[#131313] shadow ring-0 transition duration-200 ease-in-out",
                        isRegistered
                          ? "translate-x-4 sm:translate-x-5"
                          : "translate-x-0",
                      )}
                    >
                      {isRegistered ? (
                        <Check className="text-positive size-3 stroke-[3]" />
                      ) : (
                        <X className="text-subtle-foreground size-3 stroke-[3]" />
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Vista expandida de macros si está abierta */}
              {isExpanded && (
                <div className="border-border/60 bg-background animate-in fade-in mb-4 ml-16 rounded-xl border p-4 text-xs duration-150">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-muted-foreground">Proteína</span>
                      <p className="text-positive mt-1 text-sm font-bold">
                        {meal.macros.protein} g
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Carbohidratos
                      </span>
                      <p className="text-primary mt-1 text-sm font-bold">
                        {meal.macros.carbs} g
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Grasas</span>
                      <p className="text-primary mt-1 text-sm font-bold">
                        {meal.macros.fat} g
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
