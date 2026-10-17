"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

type Result = { error?: string };

/** Suma agua bebida en la fecha. Una fila por toque: deshacer es exacto. */
export async function addWater(input: {
  date: string;
  amountMl: number;
}): Promise<Result> {
  const parsed = z
    .object({
      date: z.iso.date(),
      amountMl: z.number().int().min(1).max(3000),
    })
    .safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  const { error } = await supabase.from("water_logs").insert({
    user_id: user.id,
    date: parsed.data.date,
    amount_ml: parsed.data.amountMl,
  });
  if (error) return { error: messages.common.genericError };
  revalidatePath("/nutricion");
  revalidatePath("/");
  return {};
}

/** Quita el ultimo registro de agua de la fecha (el ultimo toque). */
export async function undoLastWater(input: { date: string }): Promise<Result> {
  const parsed = z.object({ date: z.iso.date() }).safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  const { data: last } = await supabase
    .from("water_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", parsed.data.date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return {};
  const { error } = await supabase
    .from("water_logs")
    .delete()
    .eq("id", last.id);
  if (error) return { error: messages.common.genericError };
  revalidatePath("/nutricion");
  revalidatePath("/");
  return {};
}
