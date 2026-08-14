import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard;

function greetingForHour(hour: number): string {
  if (hour < 12) return t.greetingMorning;
  if (hour < 19) return t.greetingAfternoon;
  return t.greetingEvening;
}

/**
 * La cabecera de Hoy: una linea, y ya.
 *
 * Antes esto era un bloque de 190 px con degradado, marca de agua, eslogan,
 * boton y tres lecturas — y en un telefono de pie empujaba la respuesta del
 * dia por debajo del pliegue. La primera pantalla es la respuesta, no el
 * saludo. Las tres lecturas que vivian aqui ya estan mas abajo, cada una en
 * su seccion, asi que se quedaron en duplicado.
 */
export function TodayHeader({ data }: { data: DashboardData }) {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: data.timezone,
    }).format(now),
  );
  const longDate = new Intl.DateTimeFormat("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: data.timezone,
  }).format(now);

  const goalLabel = data.primaryGoal
    ? t.goals[data.primaryGoal as keyof typeof t.goals]
    : null;

  return (
    <header className="flex flex-col gap-0.5">
      <p className="label-micro">
        <span className="first-letter:uppercase">{longDate}</span>
        {goalLabel ? (
          <>
            <span aria-hidden="true"> &middot; </span>
            {goalLabel}
          </>
        ) : null}
      </p>
      <h1 className="text-base font-semibold">
        {greetingForHour(hour)}
        {data.displayName ? `, ${data.displayName}` : ""}
      </h1>
    </header>
  );
}
