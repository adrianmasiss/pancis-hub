import { messages } from "@/i18n/es-419";
import type { DayPlan } from "@/features/nutrition/queries";
import { cn } from "@/lib/utils";

const t = messages.nutrition.dayHero;
const d = messages.dashboard.nutrition;

type DayHeroCardProps = {
  plan: DayPlan;
  mealCount: number;
  loggedCount: number;
  /** Nombre de la comida pendiente cuando queda exactamente una. */
  nextPendingName: string | null;
};

/**
 * El heroe del dia: la respuesta de la pantalla antes del primer pliegue.
 *
 * Es la unica excepcion documentada al sistema de tarjetas del handoff —
 * conserva su banda de acento porque es el elemento protagonista de la
 * aplicacion. La banda se queda en un filete y un tenido muy leve en vez del
 * lavado completo del prototipo: DESIGN.md prohibe los degradados de interfaz,
 * y el color todavia no esta decidido. Cuando lo este, aqui es donde sube.
 *
 * La logica de cada macro es la del prototipo, literal: el numero grande es lo
 * que FALTA (o sobra), no lo consumido, y la barra se corta al 100 %.
 */
function macroState(consumed: number, target: number) {
  const left = Math.round(target - consumed);
  return {
    left,
    // `state` nombra el signo, no el animo: "De sobra" no es un elogio ni un
    // regano, es la direccion del desvio.
    state: left > 0 ? t.macroShort : left < 0 ? t.macroOver : t.macroMet,
    value: `${left < 0 ? "+" : ""}${Math.abs(left)} g`,
    target: t.macroOf(`${Math.round(target)} g`),
    pct: target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0,
  };
}

export function DayHeroCard({
  plan,
  mealCount,
  loggedCount,
  nextPendingName,
}: DayHeroCardProps) {
  if (!plan.targets) return null;

  const { totals, targets } = plan;
  const deltaKcal = Math.round(totals.calories - targets.calories);
  const pending = Math.max(0, mealCount - loggedCount);
  const fmt = (n: number) => Math.round(n).toLocaleString("es-419");

  /*
    Las cuatro tintas de la banda, con la formula del prototipo: el color
    semantico mezclado contra negro. La mezcla NO es decorativa — la banda es
    una superficie clara, y los colores de estado estan calibrados para leerse
    sobre el lienzo oscuro, asi que sin oscurecerlos se lavan.

    El carbohidrato sale de `--pc-brand-from`, no de `--primary`: en Gilded el
    acento ES crema, y un punto crema sobre una banda crema desaparece.
  */
  const macros = [
    {
      label: d.protein,
      ink: "color-mix(in oklab, var(--positive) 74%, #000000)",
      ...macroState(totals.proteinG, targets.proteinG),
    },
    {
      label: d.carbs,
      ink: "color-mix(in oklab, var(--pc-brand-from, var(--primary)) 80%, #000000)",
      ...macroState(totals.carbohydrateG, targets.carbohydrateG),
    },
    {
      label: d.fat,
      ink: "color-mix(in oklab, var(--caution) 66%, #000000)",
      ...macroState(totals.fatG, targets.fatG),
    },
    {
      label: d.fiber,
      ink: "color-mix(in oklab, var(--pc-bg, var(--background)) 86%, #000000)",
      ...macroState(totals.fiberG, targets.fiberG),
    },
  ];

  const stateLine =
    deltaKcal > 0
      ? t.stateOver(`${fmt(deltaKcal)} ${messages.nutrition.kcal}`)
      : deltaKcal < 0
        ? t.stateUnder(`${fmt(-deltaKcal)} ${messages.nutrition.kcal}`)
        : t.stateMet;

  const pendingLine =
    pending === 0
      ? t.pendingNone
      : pending === 1 && nextPendingName
        ? t.pendingOne(nextPendingName)
        : t.pendingMany(pending);

  return (
    <section aria-label={t.eyebrow} className="hero-band">
      <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-3">
          {/* El rotulo y el recuento son lo mismo —de que dia hablamos y como
              va— asi que comparten fila en todos los anchos. Colgados del
              segmentado con `justify-between`, en 390px el recuento caia solo
              a una linea y parecia un error de maquetado. */}
          <div className="flex items-center justify-between gap-3">
            <p className="hero-subtle label-micro min-w-0 truncate">
              {mealCount > 0
                ? `${t.eyebrow} · ${t.mealsCount(mealCount)}`
                : t.eyebrow}
            </p>
            {mealCount > 0 ? (
              <span className="hero-muted shrink-0 rounded-full border border-current/25 px-3 py-1 text-[11px] font-medium">
                {t.logged(loggedCount, pending)}
              </span>
            ) : null}
          </div>

          {/* Rango del heroe. Semana y Bloque existen en el prototipo pero
                todavia no hay consulta que los alimente: se muestran inertes,
                como el resto de lo que el repo aun no resuelve, en vez de
                inventar cifras.

                El rotulo va a la IZQUIERDA del segmentado, como el prototipo:
                nombra el eje que el segmentado recorre. Encima parecia un
                titulo de seccion mas. En telefono se oculta, que es donde no
                hay ancho para ponerlo al lado. */}
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="hero-subtle label-micro hidden max-w-[3.25rem] leading-[1.15] sm:block"
            >
              {t.rangeLabel}
            </span>
            <div
              role="tablist"
              aria-label={t.eyebrow}
              className="inline-flex h-10 gap-1 self-start rounded-[12px] border border-current/15 bg-[color-mix(in_oklab,var(--primary-foreground)_8%,transparent)] p-[3px]"
            >
              <span
                role="tab"
                aria-selected="true"
                className="flex items-center rounded-[9px] bg-[color-mix(in_oklab,#ffffff_62%,transparent)] px-4 text-[13px] font-semibold"
              >
                {t.rangeToday}
              </span>
              {[t.rangeWeek, t.rangeBlock].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  title={`${label} (${t.rangeComingSoon.toLowerCase()})`}
                  className="hero-subtle flex cursor-not-allowed items-center px-4 text-[13px] font-medium"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="num-display text-[clamp(2.75rem,11vw,3.75rem)] leading-[0.9] font-medium tracking-[-0.05em]">
            {fmt(totals.calories)}
          </span>
          <span className="hero-muted text-[15px]">
            {messages.nutrition.kcal}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-semibold",
              "bg-[color-mix(in_oklab,var(--primary-foreground)_10%,transparent)]",
            )}
          >
            {deltaKcal > 0
              ? t.over(fmt(deltaKcal), fmt(targets.calories))
              : t.under(fmt(totals.calories), fmt(targets.calories))}
          </span>
        </div>

        <p className="hero-muted max-w-[52ch] text-[15px] leading-[1.65] text-pretty">
          {stateLine} {pendingLine}
        </p>

        {/* Una columna en telefono, dos en tablet, cuatro en escritorio: son
            cuatro magnitudes comparables, y en 390px una rejilla de dos las
            deja con la cifra rota en dos lineas. */}
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {macros.map((macro) => (
            <li
              key={macro.label}
              className="hero-tile flex flex-col gap-2.5 p-4"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: macro.ink }}
                />
                <span className="truncate text-[13px] font-medium">
                  {macro.label}
                </span>
              </span>
              <span className="hero-subtle label-micro">{macro.state}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="num text-[22px] leading-none font-semibold tracking-[-0.03em]">
                  {macro.value}
                </span>
                <span className="hero-muted text-[12px]">{macro.target}</span>
              </span>
              <span
                aria-hidden="true"
                className="hero-track h-[5px] overflow-hidden rounded-full"
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-[var(--dur-base)] ease-[var(--pc-spring)]"
                  style={{ width: `${macro.pct}%`, background: macro.ink }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
