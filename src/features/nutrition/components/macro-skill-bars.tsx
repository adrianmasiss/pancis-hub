import type { MacroSet } from "../lib/macros";
import { formatMacro } from "./macro-comparison";
import "./macro-skill-bars.css";

const ROWS = [
  ["proteinG", "Proteína"],
  ["carbohydrateG", "Carbos"],
  ["fatG", "Grasas"],
  ["fiberG", "Fibra"],
] as const;

/** Thin nutrient bars use one shared gram scale across both cards. */
export function MacroSkillBars({
  macros,
  scale,
}: {
  macros: MacroSet | null;
  scale: number;
}) {
  return (
    <dl className="macro-skills">
      {ROWS.map(([key, label]) => {
        const value = macros?.[key] ?? null;
        const ratio =
          value === null
            ? 0
            : Math.min(1, Math.max(0, value / Math.max(1, scale)));
        return (
          <div key={key} className="macro-skill" data-macro={key}>
            <dt>{label}</dt>
            <dd>
              <span className="macro-skill-value">
                {value === null ? "—" : formatMacro(value)}
                <small> g</small>
              </span>
              <span className="macro-skill-bar" aria-hidden="true">
                <span
                  className="macro-skill-fill"
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Gramos que llenan la barra: el mayor macro entre todas las tarjetas. */
export function sharedMacroScale(sets: (MacroSet | null | undefined)[]) {
  return Math.max(
    1,
    ...sets.flatMap((set) => (set ? ROWS.map(([key]) => set[key] ?? 0) : [0])),
  );
}

/** El halo difuminado de la tarjeta, en el color de su papel. */
export function CompareHalo() {
  return <span className="compare-halo-orb" aria-hidden="true" />;
}
