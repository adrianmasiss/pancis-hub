/** Zonas visuales sobre el modelo normalizado a un metro. No son segmentación anatómica. */
type Region = {
  muscle: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  side: "front" | "back" | "both";
};
const paired = (
  muscle: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
  side: Region["side"],
): Region[] =>
  [-1, 1].map((sign) => ({ muscle, x: x * sign, y, rx, ry, side }));

/** Contorno visual del pectoral derecho; se refleja para el izquierdo.
 * Sigue clavícula, esternón y borde inferior del modelo, no un rectángulo.
 * Es una aproximación dibujada sobre esta malla, no una segmentación médica.
 */
const PECTORAL_POINTS: readonly (readonly [number, number])[] = [
  [0.009, 0.784],
  [0.041, 0.791],
  [0.075, 0.79],
  [0.103, 0.775],
  [0.119, 0.755],
  [0.109, 0.733],
  [0.084, 0.719],
  [0.042, 0.715],
  [0.012, 0.724],
  [0.007, 0.749],
];
// Redondea las esquinas del trazado sin invadir esternón ni axila.
export const PECTORAL_CONTOUR: readonly (readonly [number, number])[] =
  PECTORAL_POINTS.flatMap((a, i) => {
    const b = PECTORAL_POINTS[(i + 1) % PECTORAL_POINTS.length]!;
    return [
      [a[0] * 0.8 + b[0] * 0.2, a[1] * 0.8 + b[1] * 0.2] as const,
      [a[0] * 0.2 + b[0] * 0.8, a[1] * 0.2 + b[1] * 0.8] as const,
    ];
  });

/** Inclinación y estrechamiento de las zonas, siguiendo la pose de la malla. */
export const REGION_PROFILES: Readonly<
  Record<string, readonly [number, number]>
> = {
  deltoides: [0.22, 0.3],
  "deltoides-post": [0.22, 0.3],
  biceps: [0.24, 0.12],
  triceps: [0.24, 0.15],
  antebrazo: [0.2, 0.28],
  dorsal: [-0.25, 0.35],
  cuadriceps: [-0.06, 0.22],
  isquios: [-0.06, 0.18],
  gemelo: [0, 0.25],
};

/** Distancia interior al borde; cero fuera. Compartido con el shader. */
export function pectoralInterior(x: number, y: number): number {
  x = Math.abs(x);
  let inside = false;
  let distance = Infinity;
  for (let i = 0; i < PECTORAL_CONTOUR.length; i++) {
    const a = PECTORAL_CONTOUR[i]!;
    const b = PECTORAL_CONTOUR[(i + 1) % PECTORAL_CONTOUR.length]!;
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
    const ex = b[0] - a[0],
      ey = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / (ex * ex + ey * ey)),
    );
    distance = Math.min(
      distance,
      Math.hypot(x - a[0] - t * ex, y - a[1] - t * ey),
    );
  }
  return inside ? distance : 0;
}
/* Exportadas para el shader del modelo, que las evalúa por píxel. */
export const MODEL_REGIONS: readonly Region[] = [
  ...paired("pectoral", 0.055, 0.752, 0.065, 0.047, "front"),
  ...paired("deltoides", 0.137, 0.766, 0.037, 0.047, "front"),
  ...paired("deltoides-post", 0.137, 0.766, 0.037, 0.047, "back"),
  ...paired("biceps", 0.158, 0.674, 0.027, 0.065, "front"),
  ...paired("triceps", 0.158, 0.674, 0.03, 0.065, "back"),
  ...paired("antebrazo", 0.181, 0.566, 0.025, 0.068, "both"),
  { muscle: "abdomen", x: 0, y: 0.637, rx: 0.051, ry: 0.078, side: "front" },
  ...paired("oblicuo", 0.072, 0.635, 0.026, 0.07, "front"),
  ...paired("dorsal", 0.075, 0.696, 0.055, 0.068, "back"),
  { muscle: "trapecio", x: 0, y: 0.79, rx: 0.07, ry: 0.063, side: "back" },
  ...paired("lumbar", 0.027, 0.613, 0.03, 0.055, "back"),
  ...paired("gluteo", 0.059, 0.518, 0.053, 0.052, "back"),
  ...paired("cuadriceps", 0.066, 0.407, 0.05, 0.11, "front"),
  ...paired("isquios", 0.066, 0.403, 0.048, 0.095, "back"),
  ...paired("aductor", 0.026, 0.454, 0.022, 0.064, "front"),
  ...paired("gemelo", 0.068, 0.212, 0.038, 0.075, "back"),
];
const regions = MODEL_REGIONS;

export function modelRegionAt(
  x: number,
  y: number,
  normalZ: number,
): { muscle: string; strength: number } | null {
  let best: { muscle: string; strength: number } | null = null;
  for (const r of regions) {
    /* Cuánto mira la superficie hacia el lado de la zona. Antes era un corte
       seco en ±0,1: en los costados del torso los vértices vecinos caían a
       uno y otro lado y la zona salía moteada, como pelo. Ahora se apaga de a
       poco al girar hacia el costado. */
    const facing =
      r.side === "front" ? normalZ : r.side === "back" ? -normalZ : 1;
    if (facing <= 0) continue;
    const giro = Math.min(1, facing / 0.35);
    if (r.x !== 0 && x * r.x <= 0) continue;
    const [tilt, taper] = REGION_PROFILES[r.muscle] ?? [0, 0];
    const dy = (y - r.y) / r.ry;
    const dx =
      (Math.abs(x) - Math.abs(r.x) + tilt * (y - r.y)) /
      r.rx /
      Math.max(0.65, 1 + taper * dy);
    if (r.muscle === "pectoral") {
      if (x * r.x <= 0) continue;
      const interior = pectoralInterior(x, y);
      if (interior <= 0) continue;
      const strength = Math.min(1, interior / 0.012) * giro;
      if (!best || strength > best.strength)
        best = { muscle: r.muscle, strength };
      continue;
    }
    const distance = dx ** 2 + dy ** 2;
    if (distance >= 1) continue;
    const strength = Math.min(1, (1 - distance) * 1.35) * giro;
    if (!best || strength > best.strength)
      best = { muscle: r.muscle, strength };
  }
  return best;
}

/**
 * El recuadro que ocupan unos músculos sobre el modelo, y de qué lado se ven.
 * El lado es el de la mayoría: un remo (dorsal, trapecio, bíceps) se mira de
 * espaldas aunque el bíceps esté delante. Las zonas del otro lado no cuentan
 * para el recuadro: no se verían.
 */
export function encuadreDe(muscles: string[]): {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
  side: "front" | "back";
} | null {
  const zonas = regions.filter((r) => muscles.includes(r.muscle));
  if (!zonas.length) return null;
  const detras = zonas.filter((r) => r.side === "back").length;
  const delante = zonas.filter((r) => r.side === "front").length;
  const side = detras > delante ? "back" : "front";
  const visibles = zonas.filter((r) => r.side === side || r.side === "both");
  const minX = Math.min(...visibles.map((r) => r.x - r.rx));
  const maxX = Math.max(...visibles.map((r) => r.x + r.rx));
  const minY = Math.min(...visibles.map((r) => r.y - r.ry));
  const maxY = Math.max(...visibles.map((r) => r.y + r.ry));
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    halfW: (maxX - minX) / 2,
    halfH: (maxY - minY) / 2,
    side,
  };
}
