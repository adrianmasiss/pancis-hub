"use client";

import Link from "next/link";
import { BackButton } from "@/mobile/ui/back-button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Download, LogOut } from "lucide-react";
import { signOutDevice } from "@/features/auth/sign-out-device";
import { useTheme } from "@/components/theme-provider";
import { triggerHaptic } from "@/lib/haptics";
import {
  MOBILE_ACCENTS,
  accentVars,
  MOBILE_ACCENT_COOKIE,
  type MobileAccent,
} from "@/mobile/accent";
import { useMobile } from "@/mobile/shell/mobile-shell";
import { PasskeyRow } from "./passkeys";
import { Segmented, Switch } from "@/mobile/ui/controls";
import { useUnits } from "@/mobile/units";
import {
  updateTrainingAdjustment,
  updateUnitSystem,
} from "@/features/settings/actions";
import { toast } from "sonner";
import { Haptic } from "@/mobile/ui/haptic";

export type ProfileSummary = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  goal: string | null;
  since: string | null;
  workouts: number;
  streak: number;
  weightChange: number | null;
  weightSince: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFat: number | null;
  dietName: string | null;
  planName: string | null;
  planOrigin: "coach" | "ia" | null;
  dietOrigin: string | null;
  /** Ajuste por entreno vigente (preferencia o defecto por la dieta). */
  trainingAdjustment: boolean;
  trainingAdjustmentByDefault: boolean;
  remindersEnabled: boolean;
};

const COOKIE = "; path=/; max-age=31536000; samesite=lax";
const num = (n: number, d = 1) =>
  n.toLocaleString("es-CR", { maximumFractionDigits: d });
const mes = (iso: string) =>
  new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(iso))
    .replace(" de ", " ");

/** Guarda el acento (cookie que lee el servidor) y lo pinta ya. */
function storeAccent(id: MobileAccent) {
  document.cookie = `${MOBILE_ACCENT_COOKIE}=${id}${COOKIE}`;
  const app = document.querySelector<HTMLElement>(".m-app");
  for (const [name, value] of Object.entries(accentVars(id)))
    app?.style.setProperty(name, value);
}

function iniciales(name: string) {
  const p = name.replace(/@.*/, "").trim().split(/\s+/).filter(Boolean);
  return (
    (p[0]?.[0] ?? "") +
    (p.length > 1 ? (p.at(-1)?.[0] ?? "") : (p[0]?.[1] ?? ""))
  ).toUpperCase();
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="m-pref-label">{label}</span>
      <span className="m-pref-value">{value}</span>
      {href && (
        <ChevronRight size={18} className="m-chevron" aria-hidden="true" />
      )}
    </>
  );
  return href ? (
    <Link href={href} className="m-pref-row m-press">
      {inner}
    </Link>
  ) : (
    <div className="m-pref-row">{inner}</div>
  );
}

/**
 * Perfil: avatar, nombre y numeros; datos corporales, objetivo y planes;
 * apariencia (tema y color de acento, que solo cambia el telefono); cuenta.
 */
export function ProfileView({ summary: s }: { summary: ProfileSummary }) {
  const router = useRouter();
  const { accent } = useMobile();
  const { theme, setTheme } = useTheme();
  const u = useUnits();
  const [ajuste, setAjuste] = useState(s.trainingAdjustment);

  const [pending, startTransition] = useTransition();

  const pickAccent = (id: MobileAccent) => {
    triggerHaptic("selection");
    storeAccent(id);
    router.refresh();
  };

  return (
    <div className="m-screen m-profile">
      <div className="m-profile-glow" aria-hidden="true" />
      <header
        className="m-step-head"
        style={{ justifyContent: "space-between" }}
      >
        <BackButton fallback="/" />
        <span style={{ fontSize: 17, fontWeight: 800 }}>Perfil</span>
        <Link href="/configuracion?vista=editar" className="m-btn m-press">
          Editar
        </Link>
      </header>

      <div className="m-body m-stagger">
        <div className="m-profile-head">
          <span className="m-avatar m-profile-avatar" aria-hidden="true">
            {s.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase
              <img src={s.avatarUrl} alt="" />
            ) : (
              iniciales(s.displayName)
            )}
          </span>
          <h1 className="m-card-title" data-size="lg">
            {s.displayName}
          </h1>
          <p className="m-sub">
            {[s.goal, s.since ? `desde ${mes(s.since)}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="m-grid-3">
          <div className="m-card m-profile-stat" data-size="sm">
            <span className="m-stat-value">{s.workouts}</span>
            <span className="m-stat-label">Entrenos</span>
          </div>
          <div className="m-card m-profile-stat" data-size="sm">
            <span className="m-stat-value">{s.streak}</span>
            <span className="m-stat-label">Días de racha</span>
          </div>
          <div className="m-card m-profile-stat" data-size="sm">
            <span className="m-stat-value">
              {s.weightChange !== null
                ? `${s.weightChange > 0 ? "+" : s.weightChange < 0 ? "−" : ""}${u.fmtWeight(Math.abs(s.weightChange))}`
                : "—"}
            </span>
            <span className="m-stat-label">
              {s.weightSince
                ? `${u.weightUnit} desde ${mes(s.weightSince).split(" ")[0]}`
                : u.weightUnit}
            </span>
          </div>
        </div>

        <section className="m-pref-group" aria-labelledby="m-p-body">
          <h2 id="m-p-body" className="m-eyebrow m-pref-title">
            Datos corporales
          </h2>
          <div className="m-pref-card">
            <Row
              label="Estatura"
              value={
                s.heightCm
                  ? `${u.fmtLength(s.heightCm, u.imperial ? 1 : 0)} ${u.lengthUnit}`
                  : "—"
              }
              href="/configuracion?vista=editar"
            />
            <Row
              label="Peso"
              value={
                s.weightKg !== null
                  ? `${u.fmtWeight(s.weightKg)} ${u.weightUnit}`
                  : "—"
              }
              href="/progreso"
            />
            <Row
              label="% de grasa"
              value={s.bodyFat !== null ? `${num(s.bodyFat)}%` : "—"}
              href="/progreso"
            />
          </div>
        </section>

        <section className="m-pref-group" aria-labelledby="m-p-plans">
          <h2 id="m-p-plans" className="m-eyebrow m-pref-title">
            Objetivo y planes
          </h2>
          <div className="m-pref-card">
            <Row
              label="Objetivo"
              value={s.goal ?? "—"}
              href="/configuracion?vista=editar"
            />
            <Row
              label="Plan de nutrición"
              value={s.dietName ?? "Sin plan"}
              href="/nutricion/dieta"
            />
            <Row
              label="Rutina"
              value={
                s.planName
                  ? `${s.planName}${s.planOrigin === "ia" ? " · IA" : ""}`
                  : "Sin rutina"
              }
              href="/entrenamiento?vista=rutinas"
            />
            <Row
              label="Evidencia científica"
              value="De dónde salen tus cifras"
              href="/evidencia"
            />
            <div className="m-pref-row" style={{ alignItems: "flex-start" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="m-pref-label" style={{ display: "block" }}>
                  Ajuste automático por entreno
                </span>
                <span className="m-list-row-sub" style={{ display: "block" }}>
                  {s.trainingAdjustmentByDefault
                    ? s.dietOrigin === "ia"
                      ? "Encendido por defecto porque tu plan lo hizo la IA."
                      : "Apagado por defecto porque tu plan es del nutricionista."
                    : "Los días que entrenas, tu meta de calorías sube según el entreno."}
                </span>
              </span>
              <Switch
                label="Ajuste automático por entreno"
                checked={ajuste}
                onCheckedChange={(v) => {
                  setAjuste(v);
                  startTransition(async () => {
                    const r = await updateTrainingAdjustment({ enabled: v });
                    if ("error" in r) {
                      setAjuste(!v);
                      toast.error(r.error);
                    } else router.refresh();
                  });
                }}
              />
            </div>
          </div>
        </section>

        <section className="m-pref-group" aria-labelledby="m-p-look">
          <h2 id="m-p-look" className="m-eyebrow m-pref-title">
            Apariencia
          </h2>
          <div className="m-pref-card">
            <div className="m-pref-row">
              <span className="m-pref-label">Tema</span>
              <div style={{ width: 210 }}>
                <Segmented
                  label="Tema"
                  value={theme}
                  onChange={(v) => setTheme(v)}
                  options={[
                    { value: "dark", label: "Oscuro" },
                    { value: "light", label: "Claro" },
                    { value: "system", label: "Sistema" },
                  ]}
                />
              </div>
            </div>
            <div className="m-pref-row">
              <span className="m-pref-label">Color de acento</span>
              <div
                className="m-swatches"
                role="radiogroup"
                aria-label="Color de acento"
              >
                {(Object.keys(MOBILE_ACCENTS) as MobileAccent[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={accent === id}
                    aria-label={MOBILE_ACCENTS[id].label}
                    className="m-swatch m-press"
                    style={{ background: MOBILE_ACCENTS[id].fill }}
                    onClick={() => pickAccent(id)}
                  >
                    <Haptic />
                  </button>
                ))}
              </div>
            </div>
            <div className="m-pref-row">
              <span className="m-pref-label">Unidades</span>
              <div style={{ width: 128 }}>
                <Segmented
                  label="Unidades"
                  value={u.imperial ? "imperial" : "metric"}
                  onChange={(v) =>
                    startTransition(async () => {
                      const r = await updateUnitSystem({ unitSystem: v });
                      if ("error" in r) toast.error(r.error);
                      else router.refresh();
                    })
                  }
                  options={[
                    { value: "metric", label: "kg" },
                    { value: "imperial", label: "lb" },
                  ]}
                />
              </div>
            </div>
          </div>
          <p className="m-sub" style={{ fontSize: 12, padding: "0 6px" }}>
            El color de acento cambia solo la app en el teléfono.
          </p>
        </section>

        <section className="m-pref-group" aria-labelledby="m-p-security">
          <h2 id="m-p-security" className="m-eyebrow m-pref-title">
            Seguridad
          </h2>
          <div className="m-pref-card">
            <PasskeyRow />
          </div>
        </section>

        <section className="m-pref-group" aria-labelledby="m-p-account">
          <h2 id="m-p-account" className="m-eyebrow m-pref-title">
            Cuenta y privacidad
          </h2>
          <div className="m-pref-card">
            <Link
              href="/configuracion?vista=notificaciones"
              className="m-pref-row m-press"
            >
              <span className="m-pref-label">Notificaciones</span>
              <span className="m-pref-value">
                {s.remindersEnabled ? "Activadas" : "Apagadas"}
              </span>
              <ChevronRight
                size={18}
                className="m-chevron"
                aria-hidden="true"
              />
            </Link>
            <Row label="Fotos de progreso" value="Siempre privadas" />
            <Row label="Correo" value={s.email ?? "—"} />
            <a href="/api/exportar" download className="m-pref-row m-press">
              <span className="m-pref-label">Exportar mis datos</span>
              <Download size={18} className="m-chevron" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="m-pref-group" aria-labelledby="m-p-about">
          <h2 id="m-p-about" className="m-eyebrow m-pref-title">
            Acerca de
          </h2>
          <div className="m-pref-card">
            {/* El credito del maniqui 3D: la licencia CC BY 4.0 pide nombrar
                al autor, enlazar la licencia y decir si se modifico. */}
            <details className="m-about">
              <summary className="m-pref-row m-press">
                <span className="m-pref-label">Modelo 3D del cuerpo</span>
                <span className="m-pref-value">CC BY 4.0</span>
                <ChevronRight
                  size={18}
                  className="m-chevron"
                  aria-hidden="true"
                />
              </summary>
              <div className="m-about-body">
                <p>
                  Modelo «Muscle body» de{" "}
                  <a
                    href="https://sketchfab.com/DB3D2534"
                    target="_blank"
                    rel="noreferrer"
                  >
                    DB3D2534
                  </a>
                  , bajo licencia{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/deed.es"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 4.0
                  </a>
                  . Adaptado para Pancis Hub: geometría simplificada y
                  materiales propios.
                </p>
                <p>
                  Las zonas encendidas son una guía visual aproximada, no una
                  segmentación anatómica exacta.
                </p>
              </div>
            </details>
          </div>
        </section>

        <button
          type="button"
          className="m-btn m-press"
          data-variant="danger"
          data-block=""
          style={{ height: 52 }}
          disabled={pending}
          onClick={() => startTransition(() => signOutDevice())}
        >
          <LogOut size={18} aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
