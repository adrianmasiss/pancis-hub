/**
 * Tempo de cuatro fases (claim BIO-006 y doc 07A).
 *
 *   excentrica - pausa inferior - concentrica - pausa superior
 *
 * Ejemplo: "2-0-1-0" significa 2 s bajando, sin pausa abajo, 1 s subiendo,
 * sin pausa arriba.
 *
 * LO QUE LA EVIDENCIA DICE, y es menos de lo que se suele prescribir:
 * Schoenfeld 2015 encuentra hipertrofia SIMILAR con duraciones de repeticion
 * de 0.5 a 8 segundos. Ese rango es enorme, y dentro de el la velocidad no
 * decide el resultado. Solo por encima de ~10 s por repeticion aparece un
 * efecto inferior, y los propios autores avisan de que faltan estudios
 * controlados en ese extremo.
 *
 * Por eso este modulo NO prescribe tempo: solo interpreta el que el usuario
 * escriba y avisa en el unico caso donde hay evidencia de que estorba.
 * Rellenarlo automaticamente seria inventar precision.
 */

export type Tempo = {
  eccentric: number;
  bottomPause: number;
  concentric: number;
  topPause: number;
};

/** Duracion total por repeticion, en segundos. */
export function tempoDurationSeconds(tempo: Tempo): number {
  return tempo.eccentric + tempo.bottomPause + tempo.concentric + tempo.topPause;
}

/**
 * Umbral por encima del cual la evidencia si señala inferioridad para
 * hipertrofia. Por debajo de el, el tempo es cuestion de tecnica y control.
 */
export const VERY_SLOW_SECONDS = 10;

/**
 * Interpreta "2-0-1-0" y variantes con espacios o dos puntos.
 *
 * Devuelve null cuando el texto no es un tempo de cuatro fases. Un valor
 * ambiguo como "cadencia 2" NO se adivina: el doc 07A pide preguntar si
 * significa dos segundos excentricos o dos segundos totales, y adivinar seria
 * exactamente lo contrario.
 */
export function parseTempo(value: string): Tempo | null {
  const raw = value.trim();
  // Un separador al principio o al final significa que falta una fase, no que
  // haya un negativo: "-1-0-1-0" no es un tempo valido.
  if (/^[\s:·-]|[\s:·-]$/.test(raw)) return null;

  const parts = raw.split(/[\s:·-]+/).filter(Boolean);
  if (parts.length !== 4) return null;

  const numbers = parts.map((part) => {
    // "X" es notacion habitual para "explosivo", que se cuenta como 0.
    if (/^x$/i.test(part)) return 0;
    return Number(part);
  });

  if (numbers.some((n) => !Number.isFinite(n) || n < 0 || n > 30)) return null;

  const [eccentric, bottomPause, concentric, topPause] = numbers as [
    number,
    number,
    number,
    number,
  ];
  return { eccentric, bottomPause, concentric, topPause };
}

export type TempoAdvice = {
  tempo: Tempo;
  durationSeconds: number;
  /** true solo por encima de VERY_SLOW_SECONDS. */
  tooSlow: boolean;
  /** Que decirle al usuario. Nunca afirma que el tempo mejore resultados. */
  note: string;
};

export function interpretTempo(value: string): TempoAdvice | null {
  const tempo = parseTempo(value);
  if (!tempo) return null;

  const durationSeconds = tempoDurationSeconds(tempo);
  const tooSlow = durationSeconds > VERY_SLOW_SECONDS;

  return {
    tempo,
    durationSeconds,
    tooSlow,
    note: tooSlow
      ? `Cada repeticion te llevaria unos ${durationSeconds} segundos. Ir tan lento reduce la carga que puedes mover y parece rendir menos para ganar musculo.`
      : "La velocidad a la que haces cada repeticion no cambia gran cosa el musculo que ganas: entre medio segundo y ocho por repeticion los resultados son parecidos. Sirve para controlar la tecnica.",
  };
}
