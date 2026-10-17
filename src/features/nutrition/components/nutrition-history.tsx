import Link from "next/link";
import { CalendarOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { SinDato } from "@/components/shared/sin-dato";
import { V11Card, V11CardHead, V11Chip } from "@/components/shared/v11-card";
export async function NutritionHistory({
  userId,
  period = 7,
}: {
  userId: string;
  period?: 7 | 30 | 90;
}) {
  const db = await createClient();
  const { data: profile } = await db
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const today = todayInTimezone(profile?.timezone ?? "America/Costa_Rica");
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - period + 1);
  const [{ data: meals, error }, { data: target }] = await Promise.all([
    db
      .from("meals")
      .select("date,name,meal_type,meal_items(calories_snapshot)")
      .eq("user_id", userId)
      .in("status", ["completada", "completada_con_cambios"])
      .is("deleted_at", null)
      .gte("date", start.toISOString().slice(0, 10))
      .lte("date", today)
      .order("date"),
    db
      .from("nutrition_targets")
      .select("calories")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (error)
    return (
      <V11Card className="v11-padded">
        <p>No se pudo cargar el historial de comidas.</p>
        <Link href="/nutricion?vista=historial" className="v11-button mt-4">
          Volver a intentar
        </Link>
      </V11Card>
    );
  const totals = new Map<string, number>();
  for (const meal of meals ?? [])
    totals.set(
      meal.date,
      (totals.get(meal.date) ?? 0) +
        meal.meal_items.reduce(
          (sum, item) => sum + Number(item.calories_snapshot),
          0,
        ),
    );
  const days = Array.from({ length: period }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    const key = date.toISOString().slice(0, 10);
    return { key, date, value: totals.get(key) };
  });
  const values = [...totals.values()];
  const max = Math.max(...values, Number(target?.calories ?? 0), 1);
  const fmt = (n: number) => Math.round(n).toLocaleString("es-419");
  return (
    <div className="nutrition-history-grid">
      <V11Card className="v11-padded nutrition-history-chart">
        <V11CardHead
          title="Calorías por día"
          aside={
            <nav className="history-period" aria-label="Periodo del historial">
              {([7, 30, 90] as const).map((n) => (
                <Link
                  key={n}
                  href={`/nutricion?vista=historial&periodo=${n}`}
                  aria-current={n === period ? "page" : undefined}
                >
                  {n === 90 ? "Trimestre" : `${n} días`}
                </Link>
              ))}
            </nav>
          }
        />
        <p className="history-range">
          {values.length
            ? `${fmt(Math.min(...values))}–${fmt(Math.max(...values))}`
            : "Sin registros"}{" "}
          <span>{values.length ? "kcal" : ""}</span>
        </p>
        {/*
          Sin registros, el grafico reservaba sus 210px enteros con las barras
          a cero: doscientos pixeles de vacio entre el titulo y las letras de
          los dias. `data-empty` lo colapsa y mantiene el eje, que sigue
          diciendo de que semana se habla.
        */}
        <div
          className="history-bars"
          data-empty={values.length === 0 ? "" : undefined}
          role="img"
          aria-label={`Calorías registradas en los últimos ${period} días. ${values.length} días con registros.`}
        >
          {/* El marcador del objetivo solo tiene sentido con barras que
              comparar: flotando solo se lee como una etiqueta perdida. */}
          {target && values.length > 0 && (
            <div
              className="history-target"
              style={{
                bottom: `${(Number(target.calories) / max) * 150 + 26}px`,
              }}
            >
              <span>Objetivo {fmt(Number(target.calories))}</span>
            </div>
          )}
          {days.map((d, i) => (
            <div
              key={d.key}
              title={`${d.key}: ${d.value === undefined ? "sin registro" : `${fmt(d.value)} kcal`}`}
            >
              <span className="history-bar-track">
                <i
                  data-current={d.key === today}
                  style={{
                    height:
                      d.value === undefined
                        ? "0%"
                        : `${(d.value / max) * 100}%`,
                  }}
                />
              </span>
              <small>
                {period === 7
                  ? new Intl.DateTimeFormat("es-419", {
                      weekday: "narrow",
                      timeZone: "UTC",
                    }).format(d.date)
                  : i % 7 === 0
                    ? d.date.getUTCDate()
                    : ""}
              </small>
            </div>
          ))}
        </div>
        <dl className="history-summary">
          <div>
            <dt>Días con registros</dt>
            <dd>
              {values.length} de {period}
            </dd>
          </div>
          <div>
            <dt>Comidas registradas</dt>
            <dd>{meals?.length ?? 0}</dd>
          </div>
        </dl>
        {/* Tono llano a proposito: esto es la ausencia de un dato de salud,
            no una bandeja de entrada vacia. Pero sigue necesitando salida. */}
        {!values.length && (
          <EmptyState
            surface={false}
            icon={CalendarOff}
            title={`Sin registros en estos ${period} días`}
            description="La tendencia se dibuja con lo que registras cada día. Los días sin registro quedan en blanco: no se cuentan como cero calorías, porque no sabemos qué comiste."
            action={
              <Link href="/nutricion" className="v11-button">
                Registrar el día de hoy
              </Link>
            }
          />
        )}
        <details className="text-muted-foreground mt-4 text-xs">
          <summary className="cursor-pointer">Ver registros por fecha</summary>
          <dl className="history-summary">
            {days.map((d) => (
              <div key={d.key}>
                <dt>{d.key}</dt>
                <dd>
                  {d.value === undefined
                    ? "Sin registro"
                    : `${fmt(d.value)} kcal`}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </V11Card>
      <V11Card className="v11-padded">
        <V11CardHead
          title="Calorías medias"
          aside={<V11Chip>{period} días</V11Chip>}
        />
        <p className="progress-magnitude text-[42px]">
          {values.length ? (
            fmt(values.reduce((sum, n) => sum + n, 0) / values.length)
          ) : (
            <SinDato />
          )}
        </p>
        <p className="text-muted-foreground text-sm">
          Promedio de los días con comidas registradas.
        </p>
        <Link href="/historial" className="v11-button mt-6">
          Ver cambios del plan
        </Link>
      </V11Card>
    </div>
  );
}
