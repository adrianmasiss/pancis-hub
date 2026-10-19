import { ActionLink } from "@/components/ui/action";
import Link from "next/link";
import { Search } from "lucide-react";
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
    <header className="relative flex min-h-[118px] flex-col justify-end pb-5 lg:min-h-[112px] lg:justify-center lg:pb-0">
      <div className="lg:hidden">
        <p className="text-muted-foreground text-[13px] leading-5">
          <span className="first-letter:uppercase">{longDate}</span>
        </p>
        <h1 className="text-[22px] leading-6 font-medium tracking-[-0.03em]">
          {greetingForHour(hour)}
          {data.displayName ? `, ${data.displayName}` : ""}
        </h1>
        <Link
          href="/configuracion"
          aria-label={messages.nav.settings}
          className="border-hairline text-muted-foreground absolute top-14 right-0 flex size-10 items-center justify-center rounded-full border bg-transparent text-xs font-medium"
        >
          {data.displayName
            .split(/\s+/)
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?"}
        </Link>
      </div>

      <div className="hidden lg:block">
        <h1 className="text-[30px] leading-8 font-medium tracking-[-0.04em]">
          {greetingForHour(hour)}
          {data.displayName ? `, ${data.displayName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-2 text-[13px]">
          <span className="first-letter:uppercase">{longDate}</span>
          {goalLabel ? (
            <>
              <span aria-hidden="true"> &middot; </span>
              {goalLabel}
            </>
          ) : null}
        </p>
      </div>

      <div className="absolute top-[34px] right-0 hidden items-center gap-3 lg:flex">
        <Link
          href="/nutricion/alimentos"
          className="border-hairline text-muted-foreground hover:text-foreground flex h-11 w-[220px] items-center gap-2.5 rounded-md border bg-transparent px-4 text-[12px] transition-colors hover:border-white/20"
        >
          <Search className="size-3.5" aria-hidden="true" />
          Buscar alimento
        </Link>
        <ActionLink family="add" href="/nutricion">
          Registrar comida
        </ActionLink>
      </div>
    </header>
  );
}
