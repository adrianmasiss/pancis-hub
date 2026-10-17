"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Interruptor de dieta para el selector de diseño. Herramienta para VER las
 * dos pantallas de Nutrición —con plan y sin plan—, no una función de la app.
 *
 * Pasa por el camino real: `getDietPlanForDate` filtra por `is_active`, así
 * que apagar la bandera produce el mismo vacío que produciría un usuario
 * nuevo. No es una maqueta del estado vacío; es el estado vacío.
 *
 * Dos reglas que no se rompen aquí:
 *
 *  - **Apagar nunca borra.** Se baja `is_active` y el plan queda intacto con
 *    sus comidas; volver a encenderlo lo devuelve tal cual estaba.
 *  - **Solo se borra lo que esta herramienta creó.** `borrarPlanDeEjemplo`
 *    filtra por el nombre marcador, así que no puede llevarse por delante un
 *    plan real aunque se pulse por error.
 *
 * El guardia de producción está aquí y no solo en la interfaz: esconder el
 * botón no es lo mismo que cerrar la acción, y una acción de servidor es una
 * ruta pública aunque nadie la enseñe.
 */

const NOMBRE_MARCADOR = "Plan de ejemplo (herramienta de diseño)";

export type EstadoDieta = {
  /** Hay un plan activo: Nutrición muestra el tablero. */
  activa: boolean;
  /** Hay algún plan, encendido o apagado, que se pueda reactivar. */
  hayPlan: boolean;
  /** El plan de ejemplo que creó esta herramienta sigue en la cuenta. */
  hayEjemplo: boolean;
};

type Resultado = { error: string } | ({ ok: true } & EstadoDieta);

function enProduccion() {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_FONDOS !== "1"
  );
}

type Sesion =
  | { error: string; supabase?: undefined; userId?: undefined }
  | {
      error?: undefined;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
    };

async function requireUser(): Promise<Sesion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  return { supabase, userId: user.id };
}

async function leerEstado(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<EstadoDieta> {
  const { data } = await supabase
    .from("diet_templates")
    .select("id, name, is_active")
    .eq("user_id", userId);
  const planes = data ?? [];
  return {
    activa: planes.some((plan) => plan.is_active),
    hayPlan: planes.length > 0,
    hayEjemplo: planes.some((plan) => plan.name === NOMBRE_MARCADOR),
  };
}

export async function estadoDeLaDieta(): Promise<Resultado> {
  if (enProduccion()) return { error: "No disponible." };
  const sesion = await requireUser();
  if (sesion.error !== undefined) return { error: sesion.error };
  return { ok: true, ...(await leerEstado(sesion.supabase, sesion.userId)) };
}

/**
 * `activa: false` apaga el plan en curso. `activa: true` reenciende el último
 * que hubiera y, si la cuenta no tiene ninguno, siembra el de ejemplo: sin eso
 * el interruptor no serviría de nada en una cuenta recién creada, que es justo
 * la que hay que poder mirar.
 */
export async function alternarDieta(activa: boolean): Promise<Resultado> {
  if (enProduccion()) return { error: "No disponible." };
  const sesion = await requireUser();
  if (sesion.error !== undefined) return { error: sesion.error };
  const { supabase, userId } = sesion;

  if (!activa) {
    const { error } = await supabase
      .from("diet_templates")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);
    if (error) return { error: error.message };
  } else {
    /* El más reciente primero: si hay varios apagados, el que se estaba
       usando es el que se tocó por última vez. */
    const { data: candidato } = await supabase
      .from("diet_templates")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (candidato) {
      /* El disparador `tr_ensure_single_active_diet_template` se encarga de
         apagar los demás, así que no hay que hacerlo a mano. */
      const { error } = await supabase
        .from("diet_templates")
        .update({ is_active: true })
        .eq("id", candidato.id)
        .eq("user_id", userId);
      if (error) return { error: error.message };
    } else {
      const sembrado = await sembrarPlanDeEjemplo(supabase, userId);
      if (sembrado) return { error: sembrado };
    }
  }

  revalidatePath("/nutricion");
  revalidatePath("/");
  return { ok: true, ...(await leerEstado(supabase, userId)) };
}

/** Quita el plan que sembró esta herramienta. Nunca toca uno propio. */
export async function borrarPlanDeEjemplo(): Promise<Resultado> {
  if (enProduccion()) return { error: "No disponible." };
  const sesion = await requireUser();
  if (sesion.error !== undefined) return { error: sesion.error };
  const { supabase, userId } = sesion;

  const { error } = await supabase
    .from("diet_templates")
    .delete()
    .eq("user_id", userId)
    .eq("name", NOMBRE_MARCADOR);
  if (error) return { error: error.message };

  revalidatePath("/nutricion");
  revalidatePath("/");
  return { ok: true, ...(await leerEstado(supabase, userId)) };
}

/* Un día completo y creíble: cinco comidas con hora, para que la lista tenga
   sus cinco rótulos distintos (incluidos los dos `snack`, que es donde se ve
   si se desambiguan por hora). Los alimentos se buscan por nombre en el
   catálogo local; si alguno falta, la comida se siembra con los que sí estén
   en vez de fallar entera. */
const PLAN: {
  tipo: "desayuno" | "almuerzo" | "cena" | "snack";
  nombre: string;
  hora: string;
  alimentos: { nombre: string; gramos: number }[];
}[] = [
  {
    tipo: "desayuno",
    nombre: "Pinto con huevo",
    hora: "07:00",
    alimentos: [
      { nombre: "Huevo entero", gramos: 110 },
      { nombre: "Frijoles negros", gramos: 120 },
      { nombre: "Arroz blanco", gramos: 150 },
    ],
  },
  {
    tipo: "snack",
    nombre: "Yogur con banano",
    hora: "10:00",
    alimentos: [
      { nombre: "Yogur griego natural", gramos: 200 },
      { nombre: "Banano", gramos: 120 },
    ],
  },
  {
    tipo: "almuerzo",
    nombre: "Arroz con pollo",
    hora: "13:00",
    alimentos: [
      { nombre: "Arroz blanco", gramos: 200 },
      { nombre: "Pechuga de pollo", gramos: 180 },
      { nombre: "Brocoli", gramos: 150 },
    ],
  },
  {
    tipo: "snack",
    nombre: "Pan con atún",
    hora: "16:30",
    alimentos: [
      { nombre: "Pan integral", gramos: 60 },
      { nombre: "Atun en agua", gramos: 120 },
    ],
  },
  {
    tipo: "cena",
    nombre: "Camote con pollo",
    hora: "19:30",
    alimentos: [
      { nombre: "Camote", gramos: 200 },
      { nombre: "Pechuga de pollo", gramos: 150 },
    ],
  },
];

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

async function sembrarPlanDeEjemplo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data: foods } = await supabase.from("foods").select("id, name");
  if (!foods?.length) return "El catálogo de alimentos está vacío.";

  const porNombre = new Map<string, string>();
  for (const food of foods) {
    const clave = normalizar(food.name);
    if (!porNombre.has(clave)) porNombre.set(clave, food.id);
  }

  const { data: plantilla, error: errorPlantilla } = await supabase
    .from("diet_templates")
    .insert({
      user_id: userId,
      name: NOMBRE_MARCADOR,
      is_active: true,
      target_calories: 2091,
      target_protein: 126,
      target_carbs: 271,
      target_fat: 56,
    })
    .select("id")
    .single();
  if (errorPlantilla || !plantilla)
    return errorPlantilla?.message ?? "No se pudo crear el plan.";

  const { data: comidas, error: errorComidas } = await supabase
    .from("diet_template_meals")
    .insert(
      PLAN.map((comida, indice) => ({
        template_id: plantilla.id,
        meal_type: comida.tipo,
        name: comida.nombre,
        order_index: indice,
        scheduled_time: comida.hora,
      })),
    )
    .select("id, order_index");
  if (errorComidas || !comidas)
    return errorComidas?.message ?? "No se pudieron crear las comidas.";

  const porOrden = new Map(comidas.map((c) => [c.order_index, c.id]));
  const items = PLAN.flatMap((comida, indice) => {
    const mealId = porOrden.get(indice);
    if (!mealId) return [];
    return comida.alimentos.flatMap((alimento) => {
      const foodId = porNombre.get(normalizar(alimento.nombre));
      return foodId
        ? [
            {
              template_meal_id: mealId,
              food_id: foodId,
              quantity_g: alimento.gramos,
            },
          ]
        : [];
    });
  });

  if (items.length) {
    const { error } = await supabase.from("diet_template_items").insert(items);
    if (error) return error.message;
  }
  return null;
}
