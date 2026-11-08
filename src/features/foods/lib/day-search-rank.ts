import type { LibraryFood } from "../queries";

function plain(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Qué tan bien coincide el nombre con lo que se escribió: primero el nombre
 * exacto, después el que empieza así, después una palabra que empieza así, y
 * al final lo que solo lo contiene o coincide por marca o alias. Dentro de
 * cada nivel se respeta el orden de la consulta (propios y genéricos antes
 * que los productos de marca).
 */
export function dayFoodScore(query: string, food: LibraryFood): number {
  const q = plain(query.trim());
  const name = plain(food.name);
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (
    new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(
      name,
    )
  )
    return 2;
  if (name.includes(q)) return 3;
  if (food.brand && plain(food.brand).includes(q)) return 4;
  return 5;
}

export function rankDayFoods(query: string, foods: LibraryFood[]) {
  return foods
    .map((food, index) => ({ food, index, score: dayFoodScore(query, food) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ food }) => food);
}
