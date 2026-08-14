import Link from "next/link";
import { MagnitudeBar } from "@/components/shared/magnitude";
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
    <section className="surface-card px-6 py-6">
      <p className="flex items-baseline gap-2">
        <span
          className={`num-display ${over ? "text-critical" : "text-foreground"}`}
        >
          {Math.abs(energy.remaining).toLocaleString("es-419")}
        </span>
        <span className="num-strong text-muted-foreground">kcal</span>
      </p>

      <p className="text-muted-foreground mt-1 text-[0.8125rem]">
        {over ? t.overLabel : t.remainingCaption} ·{" "}
        <span className="num">
          {t.progressOf
            .replace("{consumed}", energy.consumed.toLocaleString("es-419"))
            .replace("{target}", energy.target.toLocaleString("es-419"))}
        </span>
      </p>

      <MagnitudeBar
        value={energy.consumed}
        target={energy.target}
        size="lg"
        className="mt-[18px]"
      />

      {plannedCalories !== null ? (
        <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
          <span
            className="bg-subtle-foreground size-1.5 shrink-0 rounded-full"
            aria-hidden="true"
          />
          {t.planSums.replace(
            "{calories}",
            plannedCalories.toLocaleString("es-419"),
          )}
        </p>
      ) : null}

      {notice ? (
        <p
          className={`mt-2.5 flex flex-wrap gap-x-2 text-xs text-balance ${
            notice.tone === "caution" ? "text-caution" : "text-muted-foreground"
          }`}
        >
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

      <p className="mt-2.5 text-xs">
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
    </section>
  );
}
