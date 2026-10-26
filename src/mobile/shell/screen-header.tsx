"use client";

import Link from "next/link";
import { useMobile } from "./mobile-shell";

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second =
    parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase();
}

/** Avatar del encabezado: lleva a Perfil. */
export function HeaderAvatar() {
  const { displayName, avatarUrl } = useMobile();
  return (
    <Link
      href="/configuracion"
      aria-label="Perfil y configuración"
      className="m-avatar m-press"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase
        <img src={avatarUrl} alt="" fetchPriority="low" decoding="async" />
      ) : (
        initials(displayName)
      )}
    </Link>
  );
}

/**
 * Encabezado de pantalla: titulo 30/800, subtitulo apagado, acciones de 44px
 * y el avatar.
 */
export function ScreenHeader({
  title,
  subtitle,
  actions,
  avatar = true,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  avatar?: boolean;
}) {
  return (
    <header className="m-header">
      <div className="m-header-text">
        <h1 className="m-title">{title}</h1>
        {subtitle ? <div className="m-sub">{subtitle}</div> : null}
      </div>
      {actions}
      {avatar ? <HeaderAvatar /> : null}
    </header>
  );
}
