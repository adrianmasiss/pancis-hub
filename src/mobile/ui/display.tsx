import type { CSSProperties, ReactNode } from "react";
import { Sparkles, CircleAlert } from "lucide-react";

/** Cifra grande con etiqueta pequeña y apagada debajo. */
export function Stat({
  value,
  unit,
  label,
}: {
  value: ReactNode;
  unit?: string;
  label: string;
}) {
  return (
    <div className="m-stat">
      <span className="m-stat-value">
        {value}
        {unit ? <small>{unit}</small> : null}
      </span>
      <span className="m-stat-label">{label}</span>
    </div>
  );
}

/**
 * Anillo de progreso. Se dibuja al montar (1.2 s) salvo con «reducir
 * movimiento»; despues sigue al valor con una transicion corta.
 */
export function Ring({
  value,
  size = 48,
  stroke = 4,
  color,
  label,
  children,
}: {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2 - 1;
  const len = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div
      className="m-ring"
      style={
        {
          width: size,
          height: size,
          "--ring-len": len,
          ...(color ? { "--ring-color": color } : {}),
        } as CSSProperties
      }
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="m-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="m-ring-value"
          data-draw=""
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - v)}
          opacity={v === 0 ? 0 : 1}
        />
      </svg>
      <div className="m-ring-center" aria-hidden={label ? true : undefined}>
        {children}
      </div>
    </div>
  );
}

/** Barra fina de progreso (macros, agua). */
export function Bar({ value, color }: { value: number; color?: string }) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className="m-bar" aria-hidden="true">
      <div
        className="m-bar-fill"
        data-draw=""
        style={
          {
            transform: `scaleX(${v})`,
            ...(color ? { "--bar-color": color } : {}),
          } as CSSProperties
        }
      />
    </div>
  );
}

/** Etiqueta de «hecho por IA». */
export function IaTag({ children = "IA" }: { children?: ReactNode }) {
  return (
    <span className="m-tag" data-tone="ia">
      <Sparkles size={11} strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

/** Etiqueta de dato a revisar o pendiente. */
export function PendingTag({
  children = "Pendiente",
}: {
  children?: ReactNode;
}) {
  return (
    <span className="m-tag" data-tone="warn">
      <CircleAlert size={11} strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "ia";
  children: ReactNode;
}) {
  return (
    <span className="m-tag" data-tone={tone}>
      {children}
    </span>
  );
}
