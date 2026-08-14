import { MagnitudeBar } from "@/components/shared/magnitude";
import type { TodayNutrition } from "@/features/dashboard/lib/today";
import type { ToleranceKey } from "@/features/nutrition/lib/tolerances";
import { messages } from "@/i18n/es-419";

const t = messages.dashboard.nutrition;

const UNITS: Record<ToleranceKey, string> = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
  fiber: "g",
};

/**
 * "Macros" — el segundo bloque de Hoy en la maqueta (nodo 7:2).
 *
 * Una fila por macro: nombre, lo que falta, "por comer", y la barra a 4px
 * debajo ocupando el ancho. Entre filas, un filete; la tarjeta no lleva
 * titulo, porque las cuatro filas ya dicen lo que son.
 *
 * La barra va DEBAJO de la fila de texto y no a su lado: asi todas arrancan
 * en el mismo borde y las longitudes se comparan entre si de un vistazo, que
 * es lo unico que la barra tiene que dejar hacer.
 */
export function TodayMacrosCard({ today }: { today: TodayNutrition }) {
  const macros = today.rows.filter((row) => row.macro !== "calories");

  return (
    <section className="surface-card px-5 py-1.5">
      <ul>
        {macros.map((row, index) => {
          const unit = UNITS[row.macro];
          const over = row.remaining < 0;
          return (
            <li
              key={row.macro}
              className={index > 0 ? "border-rule border-t" : undefined}
            >
              <div className="flex flex-col gap-2 py-3.5">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize">
                    {t.macroNames[row.macro]}
                  </span>
                  <span
                    className={`num shrink-0 text-sm font-semibold ${over ? "text-critical" : ""}`}
                  >
                    {over ? "+" : ""}
                    {Math.abs(row.remaining)} {unit}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[0.6875rem]">
                    {over ? t.overSuffix : t.toEat}
                  </span>
                </div>
                <MagnitudeBar
                  value={row.consumed}
                  target={row.target}
                  size="sm"
                />
                {/* La fila muestra una cifra —lo que falta—; el resto de la
                    lectura viaja para quien escucha la pantalla. */}
                <span className="sr-only">
                  {row.consumed} de {row.target} {unit}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
