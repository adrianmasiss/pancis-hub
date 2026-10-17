import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type DateSelectorProps = {
  /** Fecha seleccionada YYYY-MM-DD. */
  date: string;
  /** Fecha de hoy YYYY-MM-DD (en la zona horaria del usuario). */
  today: string;
  /** Ruta base; se navega con ?fecha=YYYY-MM-DD. */
  basePath: string;
  className?: string;
};

function shiftDate(date: string, days: number): string {
  const ms = new Date(`${date}T00:00:00Z`).getTime() + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function DateSelector({
  date,
  today,
  basePath,
  className,
}: DateSelectorProps) {
  const formattedDate = new Intl.DateTimeFormat("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  // En espanol solo la primera palabra empieza en mayuscula. `capitalize`
  // convertia "miércoles, 19 de agosto" en "Miércoles, 19 De Agosto".
  const withoutComma = formattedDate.replace(",", "");
  const label = `${withoutComma.charAt(0).toLocaleUpperCase("es-419")}${withoutComma.slice(1)}`;

  return (
    <div
      className={cn(
        "border-hairline flex h-10 w-full items-center justify-between gap-1 rounded-md border bg-transparent px-1 lg:w-auto lg:justify-start",
        className,
      )}
    >
      <Button asChild variant="ghost" size="icon-sm">
        <Link
          href={`${basePath}?fecha=${shiftDate(date, -1)}`}
          aria-label={messages.nutrition.previousDay}
        >
          <ChevronLeft className="size-4" />
        </Link>
      </Button>
      <span className="text-muted-foreground min-w-0 flex-1 px-2 text-center text-sm font-medium lg:min-w-36 lg:flex-none lg:text-[12px]">
        {label}
      </span>
      <Button asChild variant="ghost" size="icon-sm">
        <Link
          href={`${basePath}?fecha=${shiftDate(date, 1)}`}
          aria-label={messages.nutrition.nextDay}
        >
          <ChevronRight className="size-4" />
        </Link>
      </Button>
      {date !== today ? (
        <Button asChild variant="outline" size="sm">
          <Link href={basePath}>{messages.nutrition.todayButton}</Link>
        </Button>
      ) : null}
    </div>
  );
}
