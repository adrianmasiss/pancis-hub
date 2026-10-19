import { ActionLink } from "@/components/ui/action";
import Link from "next/link";
import { formatNumber } from "@/lib/format/number";

type Props = {
  consumedCalories?: number;
  targetCalories?: number;
  caloriesDelta?: number;
  registeredCount?: number;
  pendingCount?: number;
  note?: string;
};
const macros = [
  {
    name: "Proteína",
    state: "De sobra",
    value: "+24 g",
    target: 165,
    pct: 100,
    color: "protein",
  },
  {
    name: "Carbohidrato",
    state: "Faltan",
    value: "25 g",
    target: 260,
    pct: 90,
    color: "carbs",
  },
  {
    name: "Grasa",
    state: "Cumplido",
    value: "0 g",
    target: 78,
    pct: 100,
    color: "fat",
  },
  {
    name: "Fibra",
    state: "Faltan",
    value: "2 g",
    target: 34,
    pct: 94,
    color: "fiber",
  },
];
export function V11NutritionHeroCard({
  consumedCalories = 2470,
  targetCalories = 2240,
  caloriesDelta = 230,
  registeredCount = 4,
  pendingCount = 1,
  note = "Vas 230 kcal por encima del presupuesto. La cena de las 21:00 es la única que queda por registrar.",
}: Props) {
  return (
    <div className="nutrition-summary">
      <div className="nutrition-summary-head">
        <div className="flex items-center gap-3">
          <span className="label-micro">El día</span>
          <div className="nutrition-period">
            <span aria-current="date">Hoy</span>
            <Link href="/nutricion?vista=historial&periodo=7">Semana</Link>
            <Link href="/nutricion?vista=historial&periodo=30">Bloque</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="nutrition-count">
            {registeredCount} registradas · {pendingCount}{" "}
            {pendingCount === 1 ? "pendiente" : "pendientes"}
          </span>
          <ActionLink
            family="edit"
            compact
            href="/nutricion/dieta"
            aria-label="Editar plan de alimentación"
          ></ActionLink>
        </div>
      </div>
      <div className="nutrition-summary-body">
        <div>
          <div className="nutrition-calories">
            <strong>{formatNumber(consumedCalories)}</strong>
            <span>kcal</span>
          </div>
          <span className="nutrition-delta">
            {caloriesDelta >= 0 ? "+" : ""}
            {caloriesDelta} sobre {formatNumber(targetCalories)}
          </span>
          <p className="nutrition-note">{note}</p>
        </div>
        <div className="nutrition-macros">
          {macros.map((m) => (
            <div key={m.name} className="nutrition-macro" data-macro={m.color}>
              <div className="flex items-center gap-2">
                <i />
                <span>{m.name}</span>
              </div>
              <small>{m.state}</small>
              <p>
                <strong>{m.value}</strong>
                <span>de {m.target} g</span>
              </p>
              <div className="nutrition-macro-track">
                <span style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
