import Link from "next/link";
import { ChevronRight, Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { MagnitudeBar } from "@/components/shared/magnitude";
import { WhyThisNumber } from "@/features/assistant/components/why-this-number";
import { buildTodayNutrition } from "@/features/dashboard/lib/today";
import type { DashboardData } from "@/features/dashboard/queries";
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

const listMacros = (macros: ToleranceKey[]) =>
  macros.map((macro) => t.macroNames[macro]).join(", ");

/**
 * Nutricion de hoy.
 *
 * Una sola pregunta manda la pantalla — cuanto te falta — y va troquelada, a
 * la escala que se lee de pie sin acercarse el telefono. Debajo, una fila por
 * macro: rotulo, lo que falta, y la barra donde el ancho es la magnitud y la
 * muesca es donde te dejaria el plan del dia.
 */
export function TodayNutritionCard({
  data,
  targetsOutdated = false,
}: {
  data: DashboardData;
  /** true si los objetivos guardados ya no corresponden a los datos de hoy. */
  targetsOutdated?: boolean;
}) {
  const { targets, consumed, plannedTotals, tolerances } = data;

  if (!targets) {
    return (
      <section className="surface-card px-5 py-5">
        <h2 className="display-title mb-3">{t.title}</h2>
        <EmptyState
          title={t.noTargets}
          description={messages.emptyStates.nutrition.description}
          icon={Utensils}
          className="py-6"
        />
      </section>
    );
  }

  const today = buildTodayNutrition({
    target: targets,
    planned: plannedTotals,
    consumed,
    tolerances,
  });

  const energy = today.rows.find((row) => row.macro === "calories")!;
  const macros = today.rows.filter((row) => row.macro !== "calories");
  const over = energy.remaining < 0;

  /**
   * El aviso, si hay alguno. Por orden de consecuencias: pasarse ya ocurrio,
   * el plan que no llega se puede corregir hoy, unos objetivos viejos afectan
   * a todo lo demas, y no tener plan es un hecho, no una alarma.
   */
  type Notice = {
    text: string;
    tone: "caution" | "muted";
    link?: { href: string; label: string };
  };
  const notice: Notice | null =
    today.exceeded.length > 0
      ? {
          text: t.consumedOver.replace("{macros}", listMacros(today.exceeded)),
          tone: "caution",
        }
      : today.planVsTarget && !today.planVsTarget.withinTolerance
        ? {
            text: t.planOutside.replace(
              "{macros}",
              listMacros(today.planVsTarget.exceeded),
            ),
            tone: "caution",
          }
        : targetsOutdated
          ? {
              text: t.outdated,
              tone: "caution",
              link: { href: "/configuracion", label: t.outdatedLink },
            }
          : plannedTotals === null
            ? { text: t.noPlanned, tone: "muted" }
            : today.nothingLogged
              ? { text: t.dayNotStarted, tone: "muted" }
              : null;

  return (
    <section className="surface-card px-5 py-5">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="display-title">{t.title}</h2>
        <Link
          href="/nutricion"
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs transition-colors duration-150"
        >
          {t.viewPlan}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* La cifra troquelada: una por pantalla. El rotulo va DEBAJO y en
          lenguaje corriente; el antetitulo en versalitas que llevaba encima
          era justo la forma que este sistema retiro. */}
      <div className="mb-7">
        <p
          className={`num-display ${over ? "text-critical" : "text-foreground"}`}
        >
          {Math.abs(energy.remaining).toLocaleString("es-419")}
        </p>
        <p className="mt-1.5 text-sm">
          <span className="font-medium">
            {over ? t.overLabel : t.remainingCaption}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {energy.consumed.toLocaleString("es-419")} de{" "}
            {energy.target.toLocaleString("es-419")}
          </span>
        </p>
        <MagnitudeBar
          value={energy.consumed}
          target={energy.target}
          planned={energy.planned}
          className="mt-3"
        />

        {/* El gesto del dia, junto a la cifra que lo pide y a la altura del
            pulgar. Estaba solo dentro de Nutricion, a dos toques: la condicion
            de fracaso del usuario era exactamente que registrar tardara mas. */}
        <Button asChild className="mt-4 w-full sm:w-auto">
          <Link href="/nutricion">
            <Plus className="size-4" aria-hidden="true" />
            {t.logMeal}
          </Link>
        </Button>
      </div>

      <ul className="border-rule border-t">
        {macros.map((row) => {
          const unit = UNITS[row.macro];
          const rowOver = row.remaining < 0;
          return (
            <li key={row.macro} className="border-rule border-b py-3">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm capitalize">
                  {t.macroNames[row.macro]}
                </span>
                <span className="num-strong shrink-0">
                  {rowOver ? (
                    <span className="text-critical">
                      +{Math.abs(row.remaining)} {unit}
                    </span>
                  ) : (
                    <>
                      {row.remaining} {unit}
                    </>
                  )}
                </span>
              </div>
              <MagnitudeBar
                value={row.consumed}
                target={row.target}
                planned={row.planned}
              />
              {/* Una cifra por fila, y es la que el titular prometio: lo que
                  falta. El objetivo y lo consumido viven en la barra, que es
                  donde se comparan sin leer. */}
              <p className="num text-muted-foreground sr-only mt-1.5 text-xs">
                {row.consumed} de {row.target} {unit}
                {row.planned !== null ? ` · plan ${row.planned} ${unit}` : ""}
              </p>
            </li>
          );
        })}
      </ul>

      {/*
        UN aviso, el mas urgente, y nada mas.
        Antes se apilaban hasta cuatro notas de la misma voz y del mismo
        tamano bajo la seccion, que es exactamente el "ruido por pantalla" que
        este rediseno viene a quitar: cuatro cosas dichas a la vez no dicen
        ninguna. El orden es el de consecuencias, de mayor a menor.
      */}
      <div className="mt-4 flex flex-col gap-1.5 text-xs">
        {notice ? (
          <p
            className={
              notice.tone === "caution"
                ? "text-caution flex flex-wrap gap-x-2 text-balance"
                : "text-muted-foreground flex flex-wrap gap-x-2 text-balance"
            }
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

        <p className="text-muted-foreground mt-1 flex flex-wrap gap-x-2">
          <span>{t.targetNote}</span>
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
