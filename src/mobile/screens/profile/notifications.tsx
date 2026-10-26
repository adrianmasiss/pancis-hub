"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  Droplets,
  Dumbbell,
  PlusSquare,
  Share,
  Timer,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import {
  disableReminders,
  enableReminders,
  saveNotificationPrefs,
} from "@/features/reminders/actions";
import type { NotificationPrefs } from "@/features/reminders/prefs";
import { triggerHaptic } from "@/lib/haptics";
import { BackButton } from "@/mobile/ui/back-button";
import { Segmented, Switch } from "@/mobile/ui/controls";
import { Sheet } from "@/mobile/ui/sheet";
import { REST_NOTICE_KEY } from "@/mobile/rest-notice";

/**
 * En que punto esta ESTE telefono: sin soporte, iPhone sin instalar (Web
 * Push solo existe en la app agregada a inicio, iOS 16.4+), permiso negado,
 * apagadas o encendidas.
 */
type Estado =
  | "cargando"
  | "sin-soporte"
  | "sin-config"
  | "sin-sw"
  | "instalar"
  | "negado"
  | "apagadas"
  | "activas";

function esIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function instalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * El registro del service worker, ya activo. `getRegistration()` a secas
 * devolvia `undefined` si la pantalla se abria antes de que `PwaRuntime`
 * terminara de registrarlo —pasa al abrir la app instalada directo en
 * Perfil— y eso se leia como "este telefono no tiene soporte". Ahora se
 * registra aqui si falta y se espera a `ready`, con un limite.
 */
async function registroListo(): Promise<ServiceWorkerRegistration | null> {
  const actual = await navigator.serviceWorker.getRegistration();
  if (actual?.active) return actual;
  if (!actual && process.env.NODE_ENV === "production") {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch {
      return null;
    }
  }
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((listo) => window.setTimeout(() => listo(null), 6000)),
  ]);
}

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Perfil › Notificaciones: el permiso de este telefono (con su pantalla
 * previa, la guia para instalar en iPhone y que hacer si se nego) y un
 * interruptor y una hora por tipo de aviso.
 */
export function NotificationsScreen({
  enabled,
  prefs: inicial,
}: {
  /** Hay recordatorios encendidos en la cuenta (en algun dispositivo). */
  enabled: boolean;
  prefs: NotificationPrefs;
}) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [prefs, setPrefs] = useState(inicial);
  const [preOpen, setPreOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  /** En que punto esta este telefono; lo resuelve el navegador. */
  const detectar = async (): Promise<Estado> => {
    if (esIOS() && !instalada()) return "instalar";
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return "sin-soporte";
    /* La clave se incrusta al compilar: si falta en el despliegue no es culpa
       del telefono, y decirle "sin soporte" mandaba a buscar donde no era. */
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "sin-config";
    if (Notification.permission === "denied") return "negado";
    const reg = await registroListo();
    if (!reg) return "sin-sw";
    const sub = await reg.pushManager.getSubscription();
    if (sub && enabled && Notification.permission === "granted")
      return "activas";
    return "apagadas";
  };
  const revisar = () => void detectar().then(setEstado);

  useEffect(() => {
    revisar();
    // Solo al entrar: despues el estado lo cambian las acciones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* Cada cambio se guarda solo, 500 ms despues del ultimo toque. */
  const cambiar = <K extends keyof NotificationPrefs>(
    key: K,
    value: Partial<NotificationPrefs[K]>,
  ) => {
    const next = { ...prefs, [key]: { ...prefs[key], ...value } };
    setPrefs(next);
    if (key === "descanso") {
      try {
        localStorage.setItem(REST_NOTICE_KEY, next.descanso.on ? "1" : "0");
      } catch {
        /* Sin almacenamiento, el aviso queda con su valor por defecto. */
      }
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const r = await saveNotificationPrefs(next);
      if (r.error) toast.error(r.error);
    }, 500);
  };

  const activar = () =>
    startTransition(async () => {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const reg = await registroListo();
      if (!reg) {
        setPreOpen(false);
        setEstado("sin-sw");
        return;
      }
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setPreOpen(false);
        setEstado(permiso === "denied" ? "negado" : "apagadas");
        return;
      }
      try {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
        const r = await enableReminders(sub.toJSON());
        if (r.error) throw new Error(r.error);
      } catch {
        toast.error("No se pudieron activar. Inténtalo de nuevo.");
        return;
      }
      triggerHaptic("success");
      setPreOpen(false);
      setEstado("activas");
      toast.success("Listo: te avisaremos según lo que elijas abajo.");
    });

  const apagar = () =>
    startTransition(async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      await (await reg?.pushManager.getSubscription())?.unsubscribe();
      const r = await disableReminders();
      if (r.error) toast.error(r.error);
      else setEstado("apagadas");
    });

  const activas = estado === "activas";

  return (
    <div className="m-screen" data-m-fullscreen="">
      <header className="m-step-head">
        <BackButton fallback="/configuracion" label="Volver al perfil" />
        <span style={{ fontSize: 17, fontWeight: 800 }}>Notificaciones</span>
      </header>

      <div className="m-body m-stagger" style={{ paddingBottom: 40 }}>
        {estado === "activas" && (
          <div className="m-pref-card">
            <div className="m-pref-row">
              <span className="m-notif-icon" data-on="">
                <Bell size={18} aria-hidden="true" />
              </span>
              <span className="m-pref-label">Activadas en este teléfono</span>
              <Switch
                label="Notificaciones en este teléfono"
                checked
                disabled={pending}
                onCheckedChange={apagar}
              />
            </div>
          </div>
        )}

        {estado === "apagadas" && (
          <div className="m-card m-notif-cta">
            <span className="m-notif-icon">
              <BellOff size={18} aria-hidden="true" />
            </span>
            <p className="m-sheet-text">
              Están apagadas en este teléfono. Actívalas para recibir los avisos
              que elijas abajo.
            </p>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
              onClick={() => setPreOpen(true)}
            >
              <Bell size={18} aria-hidden="true" />
              Activar notificaciones
            </button>
          </div>
        )}

        {estado === "instalar" && (
          <div className="m-card m-notif-cta">
            <span className="m-card-title">
              Primero, agrega Pancis a tu inicio
            </span>
            <p className="m-sheet-text">
              En el iPhone, las notificaciones solo llegan a la app instalada
              (iOS 16.4 o posterior). Son tres pasos en Safari:
            </p>
            <ol className="m-notif-steps">
              <li>
                <span className="m-notif-icon">
                  <Share size={16} aria-hidden="true" />
                </span>
                <span>
                  Toca <strong>Compartir</strong> en la barra de Safari.
                </span>
              </li>
              <li>
                <span className="m-notif-icon">
                  <PlusSquare size={16} aria-hidden="true" />
                </span>
                <span>
                  Elige <strong>Agregar a inicio</strong>.
                </span>
              </li>
              <li>
                <span className="m-notif-icon">
                  <Bell size={16} aria-hidden="true" />
                </span>
                <span>
                  Abre Pancis desde el ícono y vuelve aquí para activarlas.
                </span>
              </li>
            </ol>
          </div>
        )}

        {estado === "negado" && (
          <div className="m-card m-notif-cta">
            <span className="m-notif-icon" data-tone="warn">
              <BellOff size={18} aria-hidden="true" />
            </span>
            <span className="m-card-title">Las bloqueaste para Pancis</span>
            <p className="m-sheet-text">
              El teléfono ya no deja pedir el permiso desde la app; se activa en
              sus ajustes:
            </p>
            <ul className="m-notif-steps" data-plain="">
              <li>
                <span>
                  <strong>iPhone:</strong> Ajustes › Notificaciones › Pancis ›
                  Permitir notificaciones.
                </span>
              </li>
              <li>
                <span>
                  <strong>Android:</strong> mantén presionado el ícono de Pancis
                  › Información de la app › Notificaciones.
                </span>
              </li>
            </ul>
            <button
              type="button"
              className="m-btn m-press"
              data-block=""
              onClick={revisar}
            >
              Ya las permití
            </button>
          </div>
        )}

        {estado === "sin-soporte" && (
          <div className="m-card m-notif-cta">
            <p className="m-sheet-text">
              Este navegador no recibe notificaciones. Abre Pancis desde la app
              instalada en tu teléfono para activarlas.
            </p>
          </div>
        )}

        {estado === "sin-config" && (
          <div className="m-card m-notif-cta">
            <span className="m-notif-icon" data-tone="warn">
              <BellOff size={18} aria-hidden="true" />
            </span>
            <span className="m-card-title">Falta configurar el servidor</span>
            <p className="m-sheet-text">
              Tu teléfono sí puede recibirlas, pero esta versión de Pancis se
              publicó sin la clave de avisos (NEXT_PUBLIC_VAPID_PUBLIC_KEY).
              Cuando se agregue y se vuelva a publicar, podrás activarlas aquí.
            </p>
          </div>
        )}

        {estado === "sin-sw" && (
          <div className="m-card m-notif-cta">
            <p className="m-sheet-text">
              Pancis todavía se está preparando en este teléfono. Espera unos
              segundos y vuelve a intentarlo; si sigue igual, cierra la app del
              todo y ábrela otra vez.
            </p>
            <button
              type="button"
              className="m-btn m-press"
              data-block=""
              onClick={revisar}
            >
              Reintentar
            </button>
          </div>
        )}

        <h2 className="m-eyebrow" style={{ marginTop: 6 }}>
          Qué te avisamos
        </h2>
        <div className="m-pref-card" data-dim={activas ? undefined : ""}>
          <Tipo
            icon={<Utensils size={18} aria-hidden="true" />}
            label="Comidas"
            hint="A la hora de cada comida de tu plan, si aún no la marcas."
            on={prefs.comidas.on}
            onToggle={(on) => cambiar("comidas", { on })}
          >
            <Segmented
              label="Cuándo avisar de las comidas"
              value={String(prefs.comidas.antes) as "0" | "15" | "30"}
              onChange={(v) =>
                cambiar("comidas", { antes: Number(v) as 0 | 15 | 30 })
              }
              options={[
                { value: "0", label: "A la hora" },
                { value: "15", label: "15 min antes" },
                { value: "30", label: "30 min antes" },
              ]}
            />
          </Tipo>
          <Tipo
            icon={<Dumbbell size={18} aria-hidden="true" />}
            label="Entreno"
            hint="Si tienes rutina y ese día no entrenaste."
            on={prefs.entreno.on}
            onToggle={(on) => cambiar("entreno", { on })}
          >
            <Hora
              label="Hora del aviso de entreno"
              value={prefs.entreno.hora}
              onChange={(hora) => cambiar("entreno", { hora })}
            />
          </Tipo>
          <Tipo
            icon={<Droplets size={18} aria-hidden="true" />}
            label="Agua"
            hint="Si a esa hora vas por debajo de tu meta."
            on={prefs.agua.on}
            onToggle={(on) => cambiar("agua", { on })}
          >
            <Hora
              label="Hora del aviso de agua"
              value={prefs.agua.hora}
              onChange={(hora) => cambiar("agua", { hora })}
            />
          </Tipo>
          <Tipo
            icon={<Timer size={18} aria-hidden="true" />}
            label="Fin del descanso"
            hint="Cuando termina el descanso entre series y no estás mirando la app."
            on={prefs.descanso.on}
            onToggle={(on) => cambiar("descanso", { on })}
          />
          <Tipo
            icon={<CalendarDays size={18} aria-hidden="true" />}
            label="Resumen semanal"
            hint="Tus entrenos y días con comidas de la semana."
            on={prefs.semanal.on}
            onToggle={(on) => cambiar("semanal", { on })}
          >
            <div className="m-notif-when">
              <label className="m-notif-time">
                <span className="sr-only">Día del resumen</span>
                <select
                  className="m-input"
                  value={prefs.semanal.dia}
                  onChange={(e) =>
                    cambiar("semanal", { dia: Number(e.target.value) })
                  }
                >
                  {DIAS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <Hora
                label="Hora del resumen semanal"
                value={prefs.semanal.hora}
                onChange={(hora) => cambiar("semanal", { hora })}
              />
            </div>
          </Tipo>
        </div>
        <p className="m-sub" style={{ fontSize: 12 }}>
          Las horas son las de tu zona horaria. Los avisos pueden llegar con
          unos minutos de diferencia.
        </p>
      </div>

      <Sheet
        open={preOpen}
        onOpenChange={setPreOpen}
        icon={
          <span className="m-sheet-icon" data-tone="accent">
            <Bell size={22} aria-hidden="true" />
          </span>
        }
        title="Te avisamos lo justo"
        description="Solo lo que elijas, a la hora que elijas. Puedes apagar cada tipo cuando quieras."
      >
        <ul className="m-notif-steps" data-plain="">
          <li>
            <Utensils size={16} aria-hidden="true" />
            <span>Cuando toca cada comida de tu plan.</span>
          </li>
          <li>
            <Dumbbell size={16} aria-hidden="true" />
            <span>Si hoy toca entrenar y aún no lo haces.</span>
          </li>
          <li>
            <Timer size={16} aria-hidden="true" />
            <span>Cuando termina tu descanso entre series.</span>
          </li>
        </ul>
        <p className="m-sub" style={{ fontSize: 12 }}>
          Después de esto, el teléfono te pedirá el permiso.
        </p>
        <div className="m-stack" style={{ gap: 8 }}>
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            disabled={pending}
            onClick={activar}
          >
            {pending ? "Activando…" : "Continuar"}
          </button>
          <button
            type="button"
            className="m-btn m-press"
            data-block=""
            onClick={() => setPreOpen(false)}
          >
            Ahora no
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Tipo({
  icon,
  label,
  hint,
  on,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="m-notif-type" data-off={on ? undefined : ""}>
      <div className="m-notif-type-head">
        <span className="m-notif-icon">{icon}</span>
        <span className="m-notif-type-text">
          <span className="m-pref-label">{label}</span>
          <span className="m-notif-hint">{hint}</span>
        </span>
        <Switch label={label} checked={on} onCheckedChange={onToggle} />
      </div>
      {children && on && <div className="m-notif-type-body">{children}</div>}
    </div>
  );
}

function Hora({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="m-notif-time">
      <span className="sr-only">{label}</span>
      <input
        type="time"
        className="m-input"
        value={value}
        onChange={(e) => {
          if (/^\d{2}:\d{2}$/.test(e.target.value)) onChange(e.target.value);
        }}
      />
    </label>
  );
}
