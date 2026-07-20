"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";
import { formatHouseholdEquivalence } from "@/features/foods/lib/equivalence";
// import { logTemplateMealAction } from "../actions";

type DietChecklistProps = {
  template: any;
};

export function DietChecklist({ template }: DietChecklistProps) {
  const router = useRouter();
  const [loadingMealId, setLoadingMealId] = useState<string | null>(null);

  const handleCheck = async (mealId: string) => {
    // setLoadingMealId(mealId);
    // await logTemplateMealAction(mealId); // Lógica pendiente de base de datos
    // setLoadingMealId(null);
    // router.refresh();
    alert("Función para registrar comida en el diario (en construcción)");
  };

  const handleSwap = (mealName: string) => {
    alert(`Buscando alternativas para: ${mealName}. Esta función requerirá sugerencias de la base de datos.`);
  };

  return (
    <Card className="border-primary/50 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <CheckCircle2 className="text-primary h-6 w-6" />
          Mi Dieta de Hoy: {template.name}
        </CardTitle>
        <CardDescription>
          Completa tus comidas para descontar los macros de tu meta diaria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {template.diet_template_meals.sort((a: any, b: any) => a.order_index - b.order_index).map((meal: any) => (
            <div key={meal.id} className="rounded-lg border p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{meal.name || meal.meal_type}</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Intercambiar"
                    onClick={() => handleSwap(meal.name)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleCheck(meal.id)}
                    disabled={loadingMealId === meal.id}
                  >
                    {loadingMealId === meal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {meal.diet_template_items.map((item: any, i: number) => {
                  const equivalence = item.serving_equivalence || formatHouseholdEquivalence(
                    Number(item.quantity_g),
                    item.foods?.food_portions || []
                  );
                  return (
                    <li key={i} className="flex justify-between border-b border-border/50 pb-1 last:border-0 last:pb-0">
                      <span>
                        {item.foods?.name || "Alimento personalizado"}
                        {equivalence ? (
                          <span className="text-muted-foreground text-xs ml-1.5 font-normal">
                            ({equivalence})
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium">{item.quantity_g}g</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
