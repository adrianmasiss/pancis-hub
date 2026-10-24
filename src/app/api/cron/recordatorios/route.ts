import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { localDateOf } from "@/lib/dates";

/*
  Recordatorios push. Lo llama un programador cada ~15 min (ver
  docs en el cierre de la tarea) con `Authorization: Bearer CRON_SECRET`.

  - Comidas: cuando llega la hora de una comida del plan (con la hora movida
    del dia, si la hay) y todavia no se registro.
  - Entreno: a las 17:00 locales, si hay rutina y hoy no se entreno.

  Cada aviso se manda una sola vez por dia (`reminder_log`). Las
  suscripciones que el navegador ya no reconoce (404/410) se borran.
*/

/** Minutos hacia atras que cubre cada pasada; la bitacora evita repetir. */
const VENTANA_MIN = 20;
const HORA_ENTRENO = 17;

function ahoraEn(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    fecha: `${get("year")}-${get("month")}-${get("day")}`,
    minutos: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const aMinutos = (hhmm: string) => {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

const TIPOS: Record<string, string> = {
  desayuno: "desayuno",
  almuerzo: "almuerzo",
  cena: "cena",
  snack: "merienda",
  otro: "comida",
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey)
    return NextResponse.json({ error: "Faltan claves VAPID" }, { status: 500 });
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:soporte@pancis.app",
    publicKey,
    privateKey,
  );

  const db = createAdminClient();
  const { data: perfiles } = await db
    .from("profiles")
    .select("id, timezone")
    .eq("reminders_enabled", true);

  let enviados = 0;
  for (const perfil of perfiles ?? []) {
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", perfil.id);
    if (!subs?.length) continue;
    const { fecha, minutos } = ahoraEn(perfil.timezone ?? "America/Costa_Rica");
    const avisos: {
      kind: "comida" | "entreno";
      ref: string;
      title: string;
      body: string;
      url: string;
    }[] = [];

    // ── Comidas del plan ──
    const { data: dieta } = await db
      .from("diet_templates")
      .select("diet_template_meals(id, name, meal_type, scheduled_time)")
      .eq("user_id", perfil.id)
      .eq("is_active", true)
      .maybeSingle();
    const comidas = dieta?.diet_template_meals ?? [];
    if (comidas.length) {
      const [{ data: movidas }, { data: hechas }] = await Promise.all([
        db
          .from("diet_meal_day_times")
          .select("template_meal_id, scheduled_time")
          .eq("user_id", perfil.id)
          .eq("date", fecha),
        db
          .from("meals")
          .select("source_template_meal_id")
          .eq("user_id", perfil.id)
          .eq("date", fecha)
          .is("deleted_at", null)
          .not("source_template_meal_id", "is", null),
      ]);
      const hora = new Map(
        (movidas ?? []).map((m) => [m.template_meal_id, m.scheduled_time]),
      );
      const registradas = new Set(
        (hechas ?? []).map((m) => m.source_template_meal_id),
      );
      for (const c of comidas) {
        const h = hora.get(c.id) ?? c.scheduled_time;
        if (!h || registradas.has(c.id)) continue;
        const diff = minutos - aMinutos(h);
        if (diff < 0 || diff > VENTANA_MIN) continue;
        avisos.push({
          kind: "comida",
          ref: c.id,
          title: `Hora de tu ${TIPOS[c.meal_type] ?? "comida"} · ${h.slice(0, 5)}`,
          body: c.name
            ? `${c.name}. Márcala cuando la comas.`
            : "Márcala cuando la comas.",
          url: `/nutricion?comida=${c.id}`,
        });
      }
    }

    // ── Entreno ──
    if (minutos >= HORA_ENTRENO * 60 && minutos < HORA_ENTRENO * 60 + 60) {
      const [{ data: plan }, { data: sesiones }] = await Promise.all([
        db
          .from("workout_plans")
          .select("name")
          .eq("user_id", perfil.id)
          .eq("active", true)
          .maybeSingle(),
        db
          .from("workout_sessions")
          .select("started_at")
          .eq("user_id", perfil.id)
          .gte(
            "started_at",
            new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          ),
      ]);
      // «Hoy» en la zona del usuario, no en UTC.
      const zona = perfil.timezone ?? "America/Costa_Rica";
      const entrenoHoy = (sesiones ?? []).some(
        (s) => localDateOf(s.started_at, zona) === fecha,
      );
      if (plan && !entrenoHoy) {
        avisos.push({
          kind: "entreno",
          ref: "dia",
          title: "¿Entrenas hoy?",
          body: `Tu rutina ${plan.name} te espera.`,
          url: "/entrenamiento?vista=hoy",
        });
      }
    }

    for (const aviso of avisos) {
      // La bitacora decide: si ya se aviso hoy, el insert choca y se salta.
      const { error: repetido } = await db.from("reminder_log").insert({
        user_id: perfil.id,
        kind: aviso.kind,
        ref: aviso.ref,
        date: fecha,
      });
      if (repetido) continue;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: aviso.title,
              body: aviso.body,
              url: aviso.url,
            }),
          );
          enviados += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410)
            await db.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }
  return NextResponse.json({ ok: true, enviados });
}
