import { ActionLink } from "@/components/ui/action";
import { V11Card, V11CardHead } from "@/components/shared/v11-card";
export type MacroItem = {
  key: string;
  label: string;
  consumed: number;
  target: number;
  unit?: string;
};
export function V11MacrosCard({
  macros,
  logMealHref = "/nutricion",
  index = 0,
}: {
  macros: MacroItem[];
  logMealHref?: string;
  index?: number;
}) {
  return (
    <V11Card index={index} className="v11-padded macros-card">
      <V11CardHead
        title="Macros del día"
        aside={
          <ActionLink family="add" href={logMealHref}>
            Registrar comida
          </ActionLink>
        }
      />
      <ul className="macro-rows">
        {macros.map((m) => {
          const target = Math.max(0, m.target),
            over = target > 0 && m.consumed > target;
          const scale = Math.max(target * 1.06, m.consumed);
          const pct = scale > 0 ? Math.min(100, (m.consumed / scale) * 100) : 0;
          return (
            <li key={m.key} className="macro-row" data-over={over}>
              <span className="macro-dot" aria-hidden="true" />
              <span className="macro-name">{m.label}</span>
              <span className="macro-track" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
                {target > 0 && (
                  <i style={{ left: `${(target / scale) * 100}%` }} />
                )}
              </span>
              <strong>
                {Math.round(m.consumed)}
                <span className="sr-only"> {m.unit ?? "g"}</span>
              </strong>
              <span className="macro-target">
                de {Math.round(target)}
                <span className="sr-only"> {m.unit ?? "g"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </V11Card>
  );
}
