import { gramos } from "./format";

/**
 * Anillo pequeño con los gramos al centro: cuanto de la meta del dia pone
 * este alimento. Sin meta, solo el numero sobre la pista.
 */
export function MacroRing({
  value,
  goal,
  color,
  label,
  size = 30,
}: {
  value: number;
  goal: number | null;
  color: string;
  label: string;
  size?: number;
}) {
  const stroke = 2.5;
  const r = size / 2 - stroke / 2 - 0.5;
  const c = 2 * Math.PI * r;
  const ratio = goal ? Math.min(1, Math.max(0.04, value / goal)) : 0;
  return (
    <span
      className="m-ring-mini"
      role="img"
      aria-label={`${label} ${gramos(value)} g`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="m-ring-mini-track"
        />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={`${(c * ratio).toFixed(1)} ${c.toFixed(1)}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="none"
          />
        )}
      </svg>
      <span className="m-num">{gramos(value)}</span>
    </span>
  );
}
