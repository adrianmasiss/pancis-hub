/**
 * La ausencia de un dato, dicha con palabras.
 *
 * Existe porque el hueco se marcaba con un guion, y un guion heredaba el
 * cuerpo del numero que sustituia: dentro de `.progress-magnitude`, que son
 * 68px a peso 600, un guion no se lee como "falta el dato" sino como una
 * barra de carga o como texto tachado. En Progreso salia cinco veces en la
 * misma pantalla.
 *
 * Aqui baja a cuerpo de texto, peso normal y tinta apagada, y dice lo que
 * pasa. Se alinea sobre la linea base del hueco que ocupa, asi que no
 * descuadra la fila.
 */
export function SinDato({ children = "Sin dato" }: { children?: string }) {
  return <span className="sin-dato">{children}</span>;
}
