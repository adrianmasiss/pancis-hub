const fmt = (n: number, decimales = 1) =>
  n.toLocaleString("es-419", { maximumFractionDigits: decimales });

/**
 * Una cifra contra su rango normal, como la barra Bajo / Normal / Alto del
 * informe.
 *
 * Es lo que convierte un número en un juicio: «10,9 kg de proteína» no dice
 * nada a solas, y «10,9 de 9,6 a 11,7» dice que estás dentro. El rango viene
 * IMPRESO por el aparato —depende de altura, sexo y edad— y no se recalcula
 * aquí; sin rango la barra no se dibuja y queda la cifra sola, que es lo
 * honesto.
 *
 * La escala se abre un 30% del ancho del rango a cada lado para que un valor
 * fuera de banda siga cayendo dentro del dibujo en vez de pegarse al borde.
 */
export function RangeBar({
  value,
  range,
  unit,
  decimals = 1,
}: {
  value: number;
  range: [number, number] | undefined;
  unit: string;
  decimals?: number;
}) {
  /* Sin rango se conserva el MISMO envoltorio y sólo se omiten la pista y el
     pie: devolver el valor pelado lo sacaba de la rejilla y la fila se
     descolocaba respecto a las que sí tienen rango. */
  if (!range) {
    return (
      <div className="range-bar" data-state="sin-rango">
        <span className="range-value">
          {fmt(value, decimals)} <small>{unit}</small>
        </span>
      </div>
    );
  }

  const [min, max] = range;
  const margen = (max - min) * 0.3 || 1;
  const desde = min - margen;
  const hasta = max + margen;
  const pos = (n: number) =>
    Math.max(0, Math.min(100, ((n - desde) / (hasta - desde)) * 100));

  const dentro = value >= min && value <= max;
  const estado = dentro ? "normal" : value < min ? "bajo" : "alto";

  return (
    <div className="range-bar" data-state={estado}>
      <span className="range-value">
        {fmt(value, decimals)} <small>{unit}</small>
      </span>
      <span className="range-track" aria-hidden="true">
        {/* La banda normal es el fondo claro; la marca es dónde caes tú. */}
        <i
          className="range-normal"
          style={{ left: `${pos(min)}%`, right: `${100 - pos(max)}%` }}
        />
        <i className="range-mark" style={{ left: `${pos(value)}%` }} />
      </span>
      <span className="range-caption">
        {/* El estado va en palabra, no sólo en color: «bajo» y «alto» no se
            distinguen por el tono a solas. */}
        <strong>
          {dentro ? "Normal" : estado === "bajo" ? "Bajo" : "Alto"}
        </strong>
        <span>
          {fmt(min, decimals)}–{fmt(max, decimals)} {unit}
        </span>
      </span>
    </div>
  );
}
