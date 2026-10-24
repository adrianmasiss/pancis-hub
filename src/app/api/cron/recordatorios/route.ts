import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDaysISO, localDateOf } from "@/lib/dates";
import { parseNotificationPrefs } from "@/features/reminders/prefs";

/*
  Recordatorios push. Lo llama un programador cada ~15 min (ver
  docs en el cierre de la tarea) con `Authorization: Bearer CRON_SECRET`.

  Cada tipo se enciende y se ajusta en Perfil › Notificaciones
  (`profiles.notification_prefs`, ver src/features/reminders/prefs.ts):

  - Comidas: a la hora de cada comida del plan (con la hora movida del dia,
    si la hay), o 15/30 min antes, si todavia no se registro.
  - Entreno: a la hora elegida (17:00 por defecto), si hay rutina y hoy no
    se entreno.
  - Agua: a la hora elegida, si el dia va por debajo de la meta.
  - Resumen semanal: el dia y la hora elegidos, con entrenos y dias con
    comidas registradas de los ultimos 7 dias.

  El fin del descanso entre series no pasa por aqui: lo avisa el telefono.

  Cada aviso se manda una sola vez por dia (`reminder_log`). Las
  suscripciones que el navegador ya no reconoce (404/410) se borran.
*/

/** Minutos hacia atras que cubre cada pasada; la bitacora evita repetir. */
const VENTANA_MIN = 20;

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
    .select("id, timezone, notification_prefs")
    .eq("reminders_enabled", true);

  let enviados = 0;
  for (const perfil of perfiles ?? []) {
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", perfil.id);
    if (!subs?.length) continue;
    const { fecha, minutos } = ahoraEn(perfil.timezone ?? "America/Costa_Rica");
    const prefs = parseNotificationPrefs(perfil.notification_prefs);
    /** Ya es la hora `hhmm` y no han pasado mas de `ventana` minutos. */
    const toca = (hhmm: string, ventana = VENTANA_MIN) => {
      const diff = minutos - aMinutos(hhmm);
      return diff >= 0 && diff <= ventana;
    };
    const avisos: {
      kind: "comida" | "entreno" | "agua" | "semanal";
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
    const comidas = prefs.comidas.on ? (dieta?.diet_template_meals ?? []) : [];
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
        const diff = minutos - (aMinutos(h) - prefs.comidas.antes);
        if (diff < 0 || diff > VENTANA_MIN) continue;
        avisos.push({
          kind: "comida",
          ref: c.id,
          title:
            prefs.comidas.antes > 0
              ? `Tu ${TIPOS[c.meal_type] ?? "comida"} es a las ${h.slice(0, 5)}`
              : `Hora de tu ${TIPOS[c.meal_type] ?? "comida"} · ${h.slice(0, 5)}`,
          body: c.name
            ? `${c.name}. Márcala cuando la comas.`
            : "Márcala cuando la comas.",
          url: `/nutricion?comida=${c.id}`,
        });
      }
    }

    // ── Entreno ──
    if (prefs.entreno.on && toca(prefs.entreno.hora, 60)) {
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

    // ── Agua ──
    if (prefs.agua.on && toca(prefs.agua.hora)) {
      const [{ data: meta }, { data: agua }] = await Promise.all([
        db
          .from("nutrition_targets")
          .select("water_ml")
          .eq("user_id", perfil.id)
          .eq("status", "active")
          .order("effective_from", { ascending: false })
          .limit(1)
          .maybeSingle(),
        db
          .from("water_logs")
          .select("amount_ml")
          .eq("user_id", perfil.id)
          .eq("date", fecha),
      ]);
      const llevas = (agua ?? []).reduce((t, w) => t + w.amount_ml, 0);
      const objetivo = meta?.water_ml ?? null;
      if (!objetivo || llevas < objetivo) {
        const litros = (ml: number) =>
          (ml / 1000).toLocaleString("es-CR", { maximumFractionDigits: 1 });
        avisos.push({
          kind: "agua",
          ref: "dia",
          title: "¿Un vaso de agua?",
          body: objetivo
            ? `Vas ${litros(llevas)} de ${litros(objetivo)} L hoy.`
            : "Registra lo que llevas hoy.",
          url: "/nutricion",
        });
      }
    }

    // ── Resumen semanal ──
    const diaSemana = new Date(`${fecha}T12:00:00Z`).getUTCDay();
    if (
      prefs.semanal.on &&
      diaSemana === prefs.semanal.dia &&
      toca(prefs.semanal.hora, 60)
    ) {
      const desde = addDaysISO(fecha, -6);
      const zona = perfil.timezone ?? "America/Costa_Rica";
      const [{ data: sesiones }, { data: comidasHechas }] = await Promise.all([
        db
          .from("workout_sessions")
          .select("started_at")
          .eq("user_id", perfil.id)
          .not("completed_at", "is", null)
          .gte(
            "started_at",
            new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
          ),
        db
          .from("meals")
          .select("date")
          .eq("user_id", perfil.id)
          .is("deleted_at", null)
          .gte("date", desde)
          .lte("date", fecha),
      ]);
      const entrenos = (sesiones ?? []).filter(
        (s) => localDateOf(s.started_at, zona) >= desde,
      ).length;
      const dias = new Set((comidasHechas ?? []).map((m) => m.date)).size;
      avisos.push({
        kind: "semanal",
        ref: fecha,
        title: "Tu semana en Pancis",
        body: `${entrenos} ${entrenos === 1 ? "entreno" : "entrenos"} y ${dias} de 7 días con comidas registradas.`,
        url: "/progreso",
      });
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
