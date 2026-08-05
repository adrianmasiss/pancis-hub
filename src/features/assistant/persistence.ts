import { createClient } from "@/lib/supabase/server";
import type { ToolSource } from "@/server/tools/types";

/**
 * Persistencia de conversaciones del copiloto (doc 08).
 *
 * Hoy cada pregunta era independiente. El doc 06 del set de julio pone la
 * memoria de la conversacion como una de las diferencias principales entre un
 * chatbot generico y lo que Pancis Hub necesita.
 *
 * NUNCA LANZA. Un fallo guardando el historial no puede tumbar la respuesta
 * que el usuario esta esperando: es la misma regla que sigue `recordChange`
 * para la auditoria. Se registra en consola y se sigue.
 *
 * SERVER-ONLY.
 */

export type ConversationOrigin =
  | "chat"
  | "comida"
  | "alimento"
  | "ejercicio"
  | "biometria";

/**
 * Guarda el turno completo: la pregunta, la respuesta y de donde salieron sus
 * cifras. Devuelve el id de la conversacion para encadenar la siguiente.
 */
export async function saveConversationTurn(input: {
  userId: string;
  conversationId?: string | null;
  origin?: ConversationOrigin;
  question: string;
  answer: string;
  provider: "reglas" | "gemini";
  sources?: ToolSource[];
}): Promise<{ conversationId: string | null }> {
  try {
    const supabase = await createClient();
    let conversationId = input.conversationId ?? null;

    if (!conversationId) {
      const { data } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: input.userId,
          origin: input.origin ?? "chat",
          // La primera pregunta da nombre a la conversacion.
          title: input.question.slice(0, 80),
        })
        .select("id")
        .single();
      conversationId = data?.id ?? null;
    } else {
      // Reordena la lista por actividad reciente.
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .eq("user_id", input.userId);
    }

    if (!conversationId) return { conversationId: null };

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      user_id: input.userId,
      role: "user",
      content: input.question,
    });

    const { data: assistantMessage } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        user_id: input.userId,
        role: "assistant",
        content: input.answer,
        provider: input.provider,
      })
      .select("id")
      .single();

    // Las citas guardan INSTANTANEA del titulo: si la fuente cambia despues,
    // la respuesta que se le dio al usuario sigue siendo auditable tal como se
    // dio, que es el punto de guardarlas.
    if (assistantMessage && input.sources && input.sources.length > 0) {
      await supabase.from("ai_citations").insert(
        input.sources.map((source) => ({
          message_id: assistantMessage.id,
          user_id: input.userId,
          cited_title: source.title,
          cited_identifier: source.identifier,
        })),
      );
    }

    return { conversationId };
  } catch (error) {
    console.error("No se pudo guardar la conversacion del copiloto:", error);
    return { conversationId: input.conversationId ?? null };
  }
}

/** Cuantas conversaciones guardadas tiene el usuario. */
export async function countConversations(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("ai_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Borra TODAS las conversaciones del usuario, con sus mensajes y sus citas.
 *
 * El doc 08 pide que la memoria sea "aislada por usuario, borrable". Aislada ya
 * lo estaba por RLS; borrable no habia forma. Y no es una comodidad: aqui se
 * guarda lo que alguien le cuenta a una app de salud sobre su cuerpo y su
 * comida, asi que poder retirarlo es parte del trato.
 *
 * Los mensajes y las citas caen por `on delete cascade`, que lo ejecuta el
 * motor y no depende de que el usuario tenga politica de borrado sobre ellos.
 *
 * A diferencia del resto del modulo, esta SI informa del fallo: un borrado que
 * falla en silencio le haria creer al usuario que sus datos ya no estan.
 */
export async function deleteAllConversations(
  userId: string,
): Promise<{ deleted: number } | { error: true }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("No se pudieron borrar las conversaciones:", error);
    return { error: true };
  }

  return { deleted: data?.length ?? 0 };
}

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

/**
 * Ultimos mensajes de una conversacion, para dar continuidad.
 *
 * `limit` existe por coste de tokens: el doc 06 pide historial RECIENTE, no
 * el historial completo indefinidamente.
 */
export async function getRecentMessages(
  userId: string,
  conversationId: string,
  limit = 8,
): Promise<ConversationMessage[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? [])
      .map((row) => ({
        role: row.role as "user" | "assistant",
        content: row.content,
        createdAt: row.created_at,
      }))
      .reverse();
  } catch {
    return [];
  }
}
