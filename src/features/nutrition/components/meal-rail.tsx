import { messages } from "@/i18n/es-419";
import type { DietTemplateMealView } from "@/features/dashboard/queries";

const t = messages.nutrition.dietPlan.rail;

/**
 * El riel del que cuelgan las comidas del dia (handoff, Nutricion).
 *
 * La linea no es un adorno: su relleno es la energia del plan ya registrada,
 * asi que de un vistazo se ve cuanto del dia esta hecho sin leer una cifra. Se
 * mide en kcal y no en numero de comidas porque un desayuno de 520 y una
 * merienda de 310 no valen lo mismo, y contar comidas dejaria la linea a la
 * mitad con el ochenta por ciento del dia hecho.
 */
export function MealRail({
  meals,
  children,
}: {
  meals: readonly DietTemplateMealView[];
  children: React.ReactNode;
}) {
  const planned = meals.reduce((sum, meal) => sum + meal.totals.calories, 0);
  const logged = meals
    .filter((meal) => meal.loggedToday)
    .reduce((sum, meal) => sum + meal.totals.calories, 0);
  const pct = planned > 0 ? Math.round((logged / planned) * 100) : 0;

  return (
    <div className="relative">
      {/* La pista y su relleno. Van detras de los nodos, alineados con el
          centro del punto de estado de cada comida. */}
      <span
        aria-hidden="true"
        className="bg-rule absolute top-0 bottom-0 left-[13px] w-px sm:left-[17px]"
      />
      <span
        aria-hidden="true"
        /* Verde, no naranja: el relleno dice lo mismo que los nodos y los
           checks —"esto ya esta hecho"— y decirlo en dos colores distintos en
           la misma columna obliga a aprender dos codigos para un solo estado.
           El naranja se reserva a lo pendiente, que es donde hay que actuar. */
        className="bg-positive absolute top-0 left-[13px] w-px transition-[height] duration-[var(--dur-long)] ease-[var(--pc-spring)] sm:left-[17px]"
        style={{ height: `${pct}%` }}
      />
      <p className="sr-only" role="status">
        {t.progress(pct)}
      </p>
      <ol className="relative">{children}</ol>
    </div>
  );
}
