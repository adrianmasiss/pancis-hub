import type { MacroSet } from "../lib/macros";

export const MACRO_COLUMNS = [
  { key: "proteinG", label: "Proteína", short: "P", unit: "g" },
  { key: "carbohydrateG", label: "Carbohidratos", short: "C", unit: "g" },
  { key: "fatG", label: "Grasas", short: "G", unit: "g" },
  { key: "fiberG", label: "Fibra", short: "F", unit: "g" },
] as const;

const fmt = (n: number) => Math.round(n).toLocaleString("es-419");

/**
 * Las columnas de macros de una fila del plan. La cabecera de cada comida y
 * cada alimento usan las MISMAS cinco celdas en la misma rejilla, asi que
 * los numeros caen en columna a lo largo de toda la lista y se leen como una
 * tabla, no como etiquetas sueltas.
 *
 * En la cabecera (`targets`) cada celda lleva una barra: que parte de la meta
 * diaria cubre esa comida. Sin meta no hay contra que medir y no se dibuja.
 */
export function MacroCells({
  macros,
  targets,
  strong = false,
}: {
  macros: MacroSet;
  targets?: MacroSet | null;
  strong?: boolean;
}) {
  return (
    <>
      {MACRO_COLUMNS.map(({ key, label, short, unit }) => {
        const target = targets?.[key];
        const pct = target && target > 0 ? (macros[key] / target) * 100 : null;
        return (
          <span
            key={key}
            className="meal-cell"
            data-macro={key}
            data-strong={strong || undefined}
          >
            <span className="meal-cell-value">
              <span className="meal-cell-short" aria-hidden="true">
                {short}
              </span>
              {fmt(macros[key])}
              <span className="meal-cell-unit">{unit}</span>
              <span className="sr-only">
                {` de ${label.toLowerCase()}`}
                {pct !== null ? `, ${Math.round(pct)}% de tu meta diaria` : ""}
              </span>
            </span>
            {pct !== null && (
              <span className="meal-cell-bar" aria-hidden="true">
                <i style={{ width: `${Math.min(100, pct)}%` }} />
              </span>
            )}
          </span>
        );
      })}
      <span
        className="meal-cell meal-cell-kcal"
        data-strong={strong || undefined}
      >
        <span className="meal-cell-value">
          {fmt(macros.calories)}
          <span className="meal-cell-unit">kcal</span>
        </span>
        {targets?.calories ? (
          <span
            className="meal-cell-bar"
            data-macro="calories"
            aria-hidden="true"
          >
            <i
              style={{
                width: `${Math.min(100, (macros.calories / targets.calories) * 100)}%`,
              }}
            />
          </span>
        ) : null}
      </span>
    </>
  );
}
