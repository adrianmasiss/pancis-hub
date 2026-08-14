import { Section } from "@/components/shared/section";
import { MacroProgress } from "@/components/shared/macro-progress";
import { messages } from "@/i18n/es-419";
import type { DayPlan } from "@/features/nutrition/queries";

const t = messages.nutrition;
const d = messages.dashboard.nutrition;

/**
 * Totales del dia en Nutricion.
 *
 * Deliberadamente NO lleva la cifra troquelada: esa vive en Hoy, y el sistema
 * admite una `num-display` por vista. Aqui la pregunta no es "cuanto me falta"
 * sino "como va repartido lo que llevo", asi que manda la lista de macros y el
 * total de energia se lee en la cabecera, junto al titulo.
 *
 * Los cuatro macros van en LISTA, no en rejilla de dos columnas: son filas
 * comparables entre si, y comparar es mas facil en una sola columna donde las
 * barras comparten el borde izquierdo.
 */
export function DaySummary({ plan }: { plan: DayPlan }) {
  if (!plan.targets) {
    return (
      <Section>
        <p className="text-muted-foreground text-sm">{t.noTargetsNote}</p>
      </Section>
    );
  }

  return (
    <Section
      title={t.dayTotals}
      action={
        <span className="num-strong">
          {plan.totals.calories.toLocaleString("es-419")}
          <span className="text-muted-foreground font-normal">
            {" "}
            {t.consumedOf} {plan.targets.calories.toLocaleString("es-419")}{" "}
            {t.kcal}
          </span>
        </span>
      }
    >
      <ul className="border-rule border-t">
        <li className="border-rule border-b py-3">
          <MacroProgress
            label={d.protein}
            consumed={plan.totals.proteinG}
            target={plan.targets.proteinG}
          />
        </li>
        <li className="border-rule border-b py-3">
          <MacroProgress
            label={d.carbs}
            consumed={plan.totals.carbohydrateG}
            target={plan.targets.carbohydrateG}
          />
        </li>
        <li className="border-rule border-b py-3">
          <MacroProgress
            label={d.fat}
            consumed={plan.totals.fatG}
            target={plan.targets.fatG}
          />
        </li>
        <li className="border-rule border-b py-3">
          <MacroProgress
            label={d.fiber}
            consumed={plan.totals.fiberG}
            target={plan.targets.fiberG}
          />
        </li>
      </ul>
      <p className="text-muted-foreground mt-3 text-xs">{d.targetNote}</p>
    </Section>
  );
}
