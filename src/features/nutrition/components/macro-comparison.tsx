import type { MacroSet } from "../lib/macros";
import { macroDifference } from "../lib/compare";

const fields = [
  ["calories", "Calorías", "kcal"],
  ["proteinG", "Proteína", "g"],
  ["carbohydrateG", "Carbos", "g"],
  ["fatG", "Grasas", "g"],
  ["fiberG", "Fibra", "g"],
] as const;
export const formatMacro = (n: number) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(n);
export function MacroSummary({
  macros,
  difference = false,
}: {
  macros: MacroSet;
  difference?: boolean;
}) {
  return (
    <div className="alternative-macros">
      {fields.slice(0, 4).map(([key, label, unit]) => (
        <span key={key} data-macro={key}>
          <b>
            {difference && macros[key] > 0 ? "+" : ""}
            {formatMacro(macros[key])}
          </b>{" "}
          {key === "calories" ? unit : `${unit} ${label.toLowerCase()}`}
        </span>
      ))}
    </div>
  );
}
export function MacroComparison({
  before,
  after,
}: {
  before: MacroSet;
  after: MacroSet;
}) {
  const diff = macroDifference(before, after);
  return (
    <table className="alternative-table">
      <caption className="sr-only">
        Aporte de las porciones: actual, alternativa y diferencia
      </caption>
      <thead>
        <tr>
          <th scope="col">Nutriente</th>
          <th scope="col">Actual</th>
          <th scope="col">Alternativa</th>
          <th scope="col">Cambio</th>
        </tr>
      </thead>
      <tbody>
        {fields.map(([key, label, unit]) => (
          <tr key={key} data-macro={key}>
            <th scope="row">
              {label} <small>({unit})</small>
            </th>
            <td>{formatMacro(before[key])}</td>
            <td>{formatMacro(after[key])}</td>
            <td data-change={diff[key] === 0 ? "same" : "different"}>
              {diff[key] > 0 ? "+" : ""}
              {formatMacro(diff[key])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
