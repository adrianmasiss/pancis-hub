import Link from "next/link";
import { EnergyRing } from "@/components/shared/energy-ring";
import { WhyThisNumber } from "@/features/assistant/components/why-this-number";
import type { TodayNutrition } from "@/features/dashboard/lib/today";
import { messages } from "@/i18n/es-419";

const t = messages.dashboard.nutrition;

export type TodayNotice = {
  text: string;
  tone: "caution" | "muted";
  link?: { href: string; label: string };
};

/**
 * "Restante" — el primer bloque de Hoy en la maqueta (nodo 6:9).
 *
 * Una sola pregunta manda la pantalla, y va troquelada: 72px con la unidad
 * en pequeño a su lado, en la misma linea base. Debajo, la lectura completa en
 * una frase, la barra de energia a 10px, y la unica nota que la maqueta deja
 * fija: cuanto suma el plan del dia.
 *
 * La cifra vive SOLA en su tarjeta. Antes compartia caja con las cuatro filas
 * de macro y con el boton de registrar, y eso le quitaba justo lo que la hace
 * funcionar: ser lo unico que hay que mirar.
 */
export function TodayRemainingCard({
  today,
  plannedCalories,
  notice,
}: {
  today: TodayNutrition;
  /** Lo que suma el plan del dia, si hay plan. */
  plannedCalories: number | null;
  /** El aviso mas urgente, si lo hay. La maqueta no lo dibuja, pero el
   *  producto lo necesita: no se puede callar que los objetivos caducaron. */
  notice: TodayNotice | null;
}) {
  const energy = today.rows.find((row) => row.macro === "calories")!;
  const over = energy.remaining < 0;

  return (
    <section className="border-hairline grid min-h-[232px] grid-cols-[142px_minmax(0,1fr)] items-center gap-5 border-y py-5 lg:min-h-[330px] lg:grid-cols-1 lg:content-center lg:justify-items-center lg:border-0 lg:px-8 lg:py-8">
      <EnergyRing
        value={energy.consumed}
        target={energy.target}
        label={t.progressOf
          .replace("{consumed}", energy.consumed.toLocaleString("es-419"))
          .replace("{target}", energy.target.toLocaleString("es-419"))}
        className="size-[142px] lg:size-[190px]"
      >
        <span
          className={`num text-[31px] leading-none font-medium tracking-[-0.045em] lg:text-[42px] ${over ? "text-critical" : "text-foreground"}`}
        >
          {Math.abs(energy.remaining).toLocaleString("es-419")}
        </span>
        <span className="text-muted-foreground mt-1 text-[11px]">kcal</span>
      </EnergyRing>

      <div className="min-w-0 lg:text-center">
        <p className="text-primary text-[10px] font-semibold tracking-[0.14em] uppercase">
          Objetivo diario
        </p>
        <p className="mt-2 text-[15px] font-medium">
          {over ? t.overLabel : t.remainingCaption}
        </p>
        <p className="text-muted-foreground num mt-1 text-xs">
          {t.progressOf
            .replace("{consumed}", energy.consumed.toLocaleString("es-419"))
            .replace("{target}", energy.target.toLocaleString("es-419"))}
        </p>

        {plannedCalories !== null ? (
          <p className="text-muted-foreground mt-4 text-xs">
            {t.planSums.replace(
              "{calories}",
              plannedCalories.toLocaleString("es-419"),
            )}
          </p>
        ) : null}

        {notice ? (
          <p className="sr-only">
            <span className="text-balance">{notice.text}</span>
            {notice.link ? (
              <Link
                href={notice.link.href}
                className="underline underline-offset-2"
              >
                {notice.link.label}
              </Link>
            ) : null}
          </p>
        ) : null}

        <p className="mt-3 text-xs">
          <WhyThisNumber
            keys={[
              "bmr_equation",
              "activity_factors",
              "goal_adjustments",
              "protein_ranges",
              "min_fat_g_per_kg",
              "fiber_g_per_1000_kcal",
            ]}
          />
        </p>
      </div>
    </section>
  );
}
