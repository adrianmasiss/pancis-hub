import { MODEL_REGIONS, encuadreDe } from "../lib/model-regions";
import { musculosDe } from "../lib/muscle-map";

/* La silueta, en las mismas coordenadas que las zonas del maniquí 3D (un
   metro de alto, x centrada): así cada músculo cae donde cae en el modelo. */
const BRAZOS = "M0.15 0.79 L0.17 0.64 L0.19 0.48";
const PIERNAS = "M0.062 0.5 L0.07 0.29 L0.07 0.05";

/**
 * Una figura humana pequeña con los músculos de un grupo encendidos, vista
 * del lado desde el que se ven. Es el icono de cada categoría de la
 * biblioteca y la imagen de los ejercicios sin fotografía.
 */
export function MuscleFigure({
  muscles,
  className,
}: {
  /** Músculos tal como los escribe el catálogo («pecho», «gluteos»…). */
  muscles: readonly string[];
  className?: string;
}) {
  const delManiqui: string[] = muscles.flatMap((m) => musculosDe(m));
  const lado = encuadreDe(delManiqui)?.side ?? "front";
  const zonas = MODEL_REGIONS.filter(
    (z) =>
      delManiqui.includes(z.muscle) && (z.side === lado || z.side === "both"),
  );
  return (
    <svg
      className={className}
      viewBox="-0.26 -1 0.52 1.02"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="scale(1 -1)">
        <g className="muscle-figure-body">
          <circle cx="0" cy="0.9" r="0.055" />
          <path d="M-0.15 0.8 Q0 0.84 0.15 0.8 L0.1 0.5 L-0.1 0.5 Z" />
          {[1, -1].map((s) => (
            <g key={s} transform={`scale(${s} 1)`}>
              <path
                className="muscle-figure-limb"
                d={BRAZOS}
                strokeWidth="0.05"
              />
              <path
                className="muscle-figure-limb"
                d={PIERNAS}
                strokeWidth="0.075"
              />
            </g>
          ))}
        </g>
        {zonas.map((z, i) => (
          <ellipse
            key={i}
            className="muscle-figure-zone"
            cx={z.x}
            cy={z.y}
            rx={z.rx}
            ry={z.ry}
          />
        ))}
      </g>
    </svg>
  );
}
