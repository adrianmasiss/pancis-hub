import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  /**
   * Delta opcional. `tone` comunica si el cambio es favorable; el signo y el
   * icono acompanan siempre al color (nunca color solo).
   */
  delta?: {
    text: string;
    direction: "up" | "down" | "flat";
    tone: "good" | "bad" | "neutral";
  };
  className?: string;
};

const DELTA_ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function MetricCard({
  label,
  value,
  hint,
  delta,
  className,
}: MetricCardProps) {
  const DeltaIcon = delta ? DELTA_ICONS[delta.direction] : null;
  return (
    /*
      La cifra va PRIMERO y el rotulo debajo, como la cifra troquelada de Hoy.
      Con el rotulo encima, "vs semana pasada" envolvia a dos lineas y empujaba
      su cifra medio renglon por debajo de las vecinas: tres lecturas que se
      comparan de un vistazo dejaban de compartir linea base. Asi las cifras
      arrancan todas arriba y el rotulo envuelve donde no estorba.
    */
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Cifra secundaria, nunca troquelada: la escala de `num-display` esta
          reservada a UNA cifra por pantalla, y aqui van varias en rejilla. */}
      <p className="num text-[1.625rem] leading-none font-semibold tracking-tight">
        {value}
      </p>
      <p className="label-micro">{label}</p>
      {delta && DeltaIcon ? (
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs",
            delta.tone === "good" && "text-positive",
            delta.tone === "bad" && "text-critical",
            delta.tone === "neutral" && "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="num">{delta.text}</span>
        </p>
      ) : null}
      {hint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}
