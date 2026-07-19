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
  const label = new Intl.DateTimeFormat("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button asChild variant="ghost" size="icon">
        <Link
          href={`${basePath}?fecha=${shiftDate(date, -1)}`}
          aria-label={messages.nutrition.previousDay}
        >
          <ChevronLeft className="size-4" />
        </Link>
      </Button>
      <span className="min-w-44 text-center text-sm font-medium capitalize">
        {label}
      </span>
      <Button asChild variant="ghost" size="icon">
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
