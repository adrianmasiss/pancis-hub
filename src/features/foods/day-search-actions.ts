"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getFoodsLibraryPage, type LibraryFood } from "./queries";
import { rankDayFoods } from "./lib/day-search-rank";
import { importWebFood } from "@/server/tools/import-web-food";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Inicia sesión para buscar alimentos.");
  return user;
}

export async function searchDayFoods(input: unknown) {
  const query = z.string().trim().min(2).max(120).parse(input);
  const user = await requireUser();
  // Se piden de más y se reordenan aquí: la consulta ordena por origen y
  // nombre, así que «pollo» traía «Abadejo» (alias «pollock») en segundo lugar.
  const { foods } = await getFoodsLibraryPage(user.id, {
    query,
    view: "todos",
    page: 1,
    pageSize: 40,
  });
  return rankDayFoods(query, foods).slice(0, 20);
}

/** Lo último que registró: con el campo vacío, casi siempre es lo que busca. */
export async function recentDayFoods(): Promise<LibraryFood[]> {
  const user = await requireUser();
  const { foods } = await getFoodsLibraryPage(user.id, {
    view: "recientes",
    page: 1,
    pageSize: 8,
  });
  return foods;
}

export async function searchDayFoodOnWeb(input: unknown) {
  // La importación valida la consulta y autentica al dueño desde su sesión.
  const result = await importWebFood(input);
  if (!result.foodId) return { result, food: null };
  const user = await requireUser().catch(() => null);
  if (!user) return { result, food: null };
  const { foods } = await getFoodsLibraryPage(user.id, {
    foodId: result.foodId,
    view: "todos",
    page: 1,
    pageSize: 1,
  });
  return { result, food: foods[0] ?? null };
}
