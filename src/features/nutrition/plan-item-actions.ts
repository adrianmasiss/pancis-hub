"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

/**
 * Edicion directa de un alimento del plan HABITUAL: cantidad y quitarlo.
 *
 * Para un solo dia no se toca la plantilla: la cantidad se ajusta con una
 * sustitucion del dia sobre el mismo alimento (`swapDietItemForDay`). Aqui
 * solo llegan los cambios que deben repetirse los proximos dias. Las RLS de
 * `diet_template_items` ya limitan las dos escrituras a la dieta propia.
 */

type Result = { error?: string };

const quantitySchema = z.object({
  templateItemId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export async function updateDietTemplateItemQuantity(
  input: z.infer<typeof quantitySchema>,
): Promise<Result> {
  const parsed = quantitySchema.safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  // La equivalencia domestica describia la cantidad anterior ("1 taza"); con
  // otra cantidad dejaria de ser cierta, asi que se borra en vez de mentir.
  const { error } = await supabase
    .from("diet_template_items")
    .update({
      quantity_g: parsed.data.quantityG,
      serving_equivalence: null,
    })
    .eq("id", parsed.data.templateItemId);
  if (error) return { error: messages.common.genericError };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return {};
}

export async function deleteDietTemplateItem(input: {
  templateItemId: string;
}): Promise<Result> {
  const parsed = z.object({ templateItemId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  const { error } = await supabase
    .from("diet_template_items")
    .delete()
    .eq("id", parsed.data.templateItemId);
  if (error) return { error: messages.common.genericError };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return {};
}
