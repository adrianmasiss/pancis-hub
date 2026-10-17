import { MagnitudeBar } from "@/components/shared/magnitude";
import { EnergyRing } from "@/components/shared/energy-ring";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";

const m = messages.macros;
const t = messages.nutrition;

/**
 * "Totales" — la tarjeta de cabecera de Nutricion (nodo 11:15).
 *
 * La cifra manda, el objetivo la acompaña en pequeño y el porcentaje va en el
 * acento a la derecha: es la unica cifra de la pantalla que responde "¿como
 * voy?" de un vistazo. Debajo, los cuatro macros como medidores CORTOS en
 * fila.
 *
 * Los medidores van en fila y no en lista —al reves que en Hoy— a proposito.
 * Aqui no se leen uno por uno: se miran los cuatro juntos para ver si el dia
 * va parejo o desbalanceado, y eso solo se ve si comparten renglon.
 */
export function PlanTotalsCard({
  consumed,
  targets,
}: {
  consumed: MacroSet;
  targets: MacroSet;
}) {
  const pct =
    targets.calories > 0
      ? Math.round((consumed.calories / targets.calories) * 100)
      : 0;

  const gauges: {
    label: string;
    short: string;
    value: number;
    target: number;
  }[] = [
    {
      label: m.protein.label,
      short: m.protein.short,
      value: consumed.proteinG,
      target: targets.proteinG,
    },
    {
      label: m.carbs.label,
      short: m.carbs.short,
      value: consumed.carbohydrateG,
      target: targets.carbohydrateG,
    },
    {
      label: m.fat.label,
      short: m.fat.short,
      value: consumed.fatG,
      target: targets.fatG,
    },
    {
      label: m.fiber.label,
      short: m.fiber.short,
      value: consumed.fiberG,
      target: targets.fiberG,
    },
  ];

  return (
    <section className="border-hairline border py-5 lg:px-6 lg:py-6">
      <h2 className="hidden text-[16px] font-medium lg:block">
        Resumen del día
      </h2>

      <div className="grid grid-cols-[116px_minmax(0,1fr)] items-center gap-5 px-4 lg:mt-5 lg:grid-cols-1 lg:justify-items-center lg:px-0">
        <EnergyRing
          value={consumed.calories}
          target={targets.calories}
          label={`${pct}% de ${targets.calories} ${t.kcal}`}
          className="size-[116px] lg:size-[152px]"
        >
          <span className="num text-[22px] leading-none font-medium tracking-[-0.035em] lg:text-[27px]">
            {Math.round(consumed.calories).toLocaleString("es-419")}
            <span className="text-muted-foreground mx-1 font-normal">/</span>
            {targets.calories.toLocaleString("es-419")}
          </span>
          <span className="text-muted-foreground mt-1 text-[10px]">kcal</span>
        </EnergyRing>

        <div className="flex w-full flex-col gap-3.5 lg:mt-1 lg:gap-4">
          {gauges.map((gauge) => (
            <div
              key={gauge.label}
              className="flex min-w-0 flex-1 flex-col gap-1.5 lg:w-full"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span
                  className="label-micro text-muted-foreground font-medium"
                  aria-hidden="true"
                >
                  <span className="lg:hidden">{gauge.short}</span>
                  <span className="hidden lg:inline">{gauge.label}</span>
                </span>
                <span className="num text-foreground hidden text-xs font-semibold lg:inline">
                  {Math.max(0, Math.round(gauge.target - gauge.value))} g
                </span>
              </span>
              <MagnitudeBar
                value={gauge.value}
                target={gauge.target}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
