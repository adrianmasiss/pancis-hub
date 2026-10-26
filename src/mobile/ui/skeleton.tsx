import { messages } from "@/i18n/es-419";

/**
 * Esqueletos de la vista movil: copian la geometria de cada pantalla
 * (encabezado de 30 px con el avatar, pestañas y tarjetas de su altura) para
 * que la llegada de los datos no empuje nada. Los usa el `loading.tsx` de
 * cada seccion cuando `isPhone()`.
 */
type Variant = "inicio" | "entrenar" | "nutricion" | "progreso" | "general";

/* Alturas de tarjeta por pantalla, medidas sobre las pantallas reales. */
const TARJETAS: Record<Variant, number[]> = {
  inicio: [196, 176, 120, 96],
  entrenar: [320, 132, 132],
  nutricion: [232, 96, 72, 72, 72],
  progreso: [260, 120, 120],
  general: [180, 120, 120],
};

const CON_PESTANAS: Variant[] = ["entrenar", "nutricion", "progreso"];

export function MobileSkeleton({ variant = "general" }: { variant?: Variant }) {
  return (
    <div
      className="m-screen m-skeleton"
      role="status"
      aria-label={messages.common.loading}
    >
      <div className="m-header">
        <div className="m-header-text">
          <span className="m-sk" style={{ width: 150, height: 30 }} />
          <span
            className="m-sk"
            style={{ width: 200, height: 13, marginTop: 8 }}
          />
        </div>
        <span
          className="m-sk"
          style={{ width: 44, height: 44, borderRadius: 22 }}
        />
      </div>
      <div className="m-body">
        {CON_PESTANAS.includes(variant) && (
          <span className="m-sk" style={{ height: 44, borderRadius: 22 }} />
        )}
        {TARJETAS[variant].map((alto, i) => (
          <span
            key={i}
            className="m-sk"
            style={{
              height: alto,
              borderRadius: 24,
              animationDelay: `${i * 90}ms`,
            }}
          />
        ))}
      </div>
      <span className="sr-only">{messages.common.loading}</span>
    </div>
  );
}
