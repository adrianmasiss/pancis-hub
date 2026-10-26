import { MACROS } from "./format";

/* Proteina, carbohidratos y grasas: los que suman kcal. La fibra va aparte. */
export const TRES = MACROS.slice(0, 3);
const KCAL_POR_G = { proteinG: 4, carbohydrateG: 4, fatG: 9 } as const;

/** De donde salen las kcal de la comida, en tres tramos de color. */
export function MacroSplitBar({
  macros,
}: {
  macros: { proteinG: number; carbohydrateG: number; fatG: number };
}) {
  const partes = TRES.map((m) => ({
    ...m,
    kcal:
      macros[m.key as keyof typeof KCAL_POR_G] *
      KCAL_POR_G[m.key as keyof typeof KCAL_POR_G],
  }));
  const total = partes.reduce((t, p) => t + p.kcal, 0);
  return (
    <span className="m-split" aria-hidden="true">
      {total > 0 &&
        partes.map((p) => (
          <span
            key={p.key}
            style={{ flexGrow: p.kcal / total, background: p.color }}
          />
        ))}
    </span>
  );
}
