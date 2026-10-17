"use client";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { clampAmount, type MeasureUnit } from "../lib/units";
import "./quantity-stepper.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
/* Mantener pulsado repite: tras una pausa corta para no disparar sin querer,
   y luego cada vez más rápido, para llegar de 100 a 500 g sin cien toques. */
const HOLD_DELAY = 380;
const HOLD_START = 110;
const HOLD_MIN = 45;

const display = (unit: MeasureUnit, n: number) =>
  new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: unit.decimals,
    useGrouping: false,
  }).format(n);

/**
 * Contador de cantidad: una cápsula con − y + finos a los lados y la cifra
 * en un disco elevado en el centro. La cifra es a la vez el campo (se toca y
 * se escribe) y la unidad, a su lado, es el selector de unidad.
 *
 * Movimiento, y por qué:
 * - La cifra rueda: sube desde abajo al aumentar y baja desde arriba al
 *   disminuir. La dirección es la información; el cambio no se lee como un
 *   parpadeo. Mientras se escribe no rueda nada: escribir es manipulación
 *   directa y la cifra tiene que estar donde está el dedo.
 * - El disco se inclina un poco hacia el botón pulsado y vuelve, como si lo
 *   empujara.
 * - En el tope el disco rebota en vez de quedarse quieto: el botón no deja
 *   de responder, dice «hasta aquí».
 */
export function QuantityStepper({
  value,
  onChange,
  unit,
  units,
  onUnitChange,
}: {
  value: number;
  onChange: (next: number) => void;
  unit: MeasureUnit;
  units: MeasureUnit[];
  onUnitChange: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  /* El borrador sólo existe mientras se edita; fuera de edición el campo
     muestra el valor, así que no hay nada que sincronizar. */
  const [draft, setDraft] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const valueRef = useRef(value);
  const hold = useRef<{ timer?: number; interval: number }>({
    interval: HOLD_START,
  });

  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => () => window.clearTimeout(hold.current.timer), []);

  const parse = (text: string) => Number(text.replace(",", "."));

  const nudge = (dir: 1 | -1, blocked: boolean) => {
    if (reduce || !scope.current) return;
    animate(
      scope.current,
      blocked ? { x: [0, dir * 6, dir * -2, 0] } : { x: [0, dir * 3, 0] },
      { duration: blocked ? 0.34 : 0.2, ease: EASE_OUT },
    );
  };

  const bump = (dir: 1 | -1) => {
    const current = valueRef.current;
    const { step } = unit;
    /* Un paso desde un valor suelto (37 g) cae en la decena siguiente (40 g),
       no en otro valor suelto (47 g). El margen absorbe el error de coma
       flotante: 0,3 / 0,1 no da 3 exacto. */
    const steps = current / step;
    const next = clampAmount(
      unit,
      dir === 1
        ? (Math.floor(steps + 1e-9) + 1) * step
        : (Math.ceil(steps - 1e-9) - 1) * step,
    );
    const blocked = next === current;
    nudge(dir, blocked);
    if (blocked) return false;
    /* El ref se adelanta al render: la repetición siguiente ya parte de aquí
       aunque React no haya pintado todavía. */
    valueRef.current = next;
    setDirection(dir);
    onChange(next);
    return true;
  };

  const stopHold = () => {
    window.clearTimeout(hold.current.timer);
    hold.current = { interval: HOLD_START };
  };
  const startHold = (dir: 1 | -1) => {
    stopHold();
    if (!bump(dir)) return;
    const repeat = () => {
      if (!bump(dir)) return stopHold();
      hold.current.interval = Math.max(HOLD_MIN, hold.current.interval * 0.86);
      hold.current.timer = window.setTimeout(repeat, hold.current.interval);
    };
    hold.current.timer = window.setTimeout(repeat, HOLD_DELAY);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = parse(draft);
    const next = draft && parsed > 0 ? clampAmount(unit, parsed) : value;
    setDraft(null);
    if (next !== value) onChange(next);
  };

  const stepLabel = `${display(unit, unit.step)} ${unit.step === 1 ? unit.short : unit.plural}`;
  /* Puntero: paso al apretar (no al soltar) y repetición al mantener.
     Teclado: el clic sin puntero (detail 0) da un solo paso. */
  const stepButton = (dir: 1 | -1) => (
    <button
      type="button"
      className="qty-stepper-step"
      aria-label={`${dir === 1 ? "Añadir" : "Quitar"} ${stepLabel}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        startHold(dir);
      }}
      onPointerUp={() => stopHold()}
      onPointerLeave={() => stopHold()}
      onPointerCancel={() => stopHold()}
      onClick={(event) => {
        if (event.detail === 0) bump(dir);
      }}
    >
      {dir === 1 ? (
        <Plus size={20} strokeWidth={1.4} aria-hidden="true" />
      ) : (
        <Minus size={20} strokeWidth={1.4} aria-hidden="true" />
      )}
    </button>
  );
  const editing = draft !== null;
  const shown = draft ?? display(unit, value);
  const word = value === 1 ? unit.short : unit.plural;
  /* «100g» y «250ml» van pegados, como en la etiqueta; una palabra
     («2 tazas») lleva su espacio. */
  const symbol = /^(g|kg|oz|lb|ml|l)$/.test(unit.short);

  return (
    <div className="qty-stepper" role="group" aria-label="Cantidad">
      {stepButton(-1)}
      <div
        ref={scope}
        className="qty-stepper-disc"
        data-editing={editing ? "" : undefined}
        /* El ancho de la cifra sigue a sus caracteres (también mientras se
           escribe), y el disco crece de círculo a píldora sólo cuando hace
           falta. */
        style={
          {
            "--digits": Math.max(1, shown.length),
          } as React.CSSProperties
        }
      >
        <span className="qty-stepper-cell">
          <input
            type="text"
            inputMode={unit.decimals > 0 ? "decimal" : "numeric"}
            value={shown}
            aria-label={`Cantidad en ${unit.plural}`}
            onFocus={(event) => {
              setDraft(display(unit, value));
              event.target.select();
            }}
            onChange={(event) => {
              const clean = event.target.value
                .replace(/[^0-9.,]/g, "")
                .replace(/([.,].*)[.,]/g, "$1")
                .slice(0, 6);
              setDraft(clean);
              /* Lo escrito se aplica al momento si es válido: las cifras de la
                 ficha siguen al dedo mientras se escribe. */
              const parsed = parse(clean);
              if (clean && parsed >= unit.min && parsed <= unit.max) {
                setDirection(parsed >= value ? 1 : -1);
                onChange(parsed);
              }
            }}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setDraft(null);
                event.currentTarget.blur();
              }
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                if (bump(event.key === "ArrowUp" ? 1 : -1))
                  setDraft(display(unit, valueRef.current));
              }
            }}
          />
          {/* La cifra que se ve fuera de edición, la que rueda. El campo debajo
            tiene el mismo valor, así que el lector de pantalla no la lee. */}
          <span className="qty-stepper-roll" aria-hidden="true">
            <AnimatePresence
              initial={false}
              mode="popLayout"
              custom={direction}
            >
              <motion.span
                key={`${unit.id}:${value}`}
                custom={direction}
                variants={{
                  enter: (dir: number) =>
                    reduce ? { opacity: 0 } : { y: `${dir * 70}%`, opacity: 0 },
                  center: { y: "0%", opacity: 1 },
                  exit: (dir: number) =>
                    reduce
                      ? { opacity: 0 }
                      : { y: `${dir * -70}%`, opacity: 0 },
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                {display(unit, value)}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
        {/* La unidad es el selector. Se ve la forma corta junto a la cifra;
            el selector nativo, transparente encima, abre la lista completa
            con lo que pesa cada medida. */}
        <span className="qty-stepper-unit" data-word={symbol ? undefined : ""}>
          <span aria-hidden="true">{word}</span>
          {units.length > 1 && (
            <ChevronDown size={9} strokeWidth={2.2} aria-hidden="true" />
          )}
          {units.length > 1 && (
            <select
              aria-label="Unidad de medida"
              value={unit.id}
              onChange={(event) => onUnitChange(event.target.value)}
            >
              {units.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </span>
      </div>
      {stepButton(1)}
    </div>
  );
}
