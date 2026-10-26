"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { triggerHaptic } from "@/lib/haptics";

/** Alto de cada opcion; el CSS (`.m-wheel`) usa el mismo. */
const ITEM = 40;

export type WheelOption<T> = { value: T; label: string };

/**
 * Columna de rueda tipo iOS: se desliza con el dedo y se asienta en una
 * opcion (scroll-snap nativo, asi hereda la inercia del sistema). La banda
 * del centro (`Wheels`) marca la elegida; cada cambio da un toque de haptica.
 *
 * Con teclado es un `listbox`: flechas arriba y abajo.
 */
export function WheelColumn<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: WheelOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const current = useRef(index);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Arranca en el valor actual, sin animar.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (Math.round(el.scrollTop / ITEM) !== index) el.scrollTop = index * ITEM;
    current.current = index;
  }, [index]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const i = Math.min(
        options.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM)),
      );
      if (i !== current.current) {
        current.current = i;
        triggerHaptic("selection");
        onChangeRef.current(options[i]!.value);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [options]);

  const ir = (i: number) =>
    ref.current?.scrollTo({
      top: Math.min(options.length - 1, Math.max(0, i)) * ITEM,
      behavior: "smooth",
    });

  return (
    <div
      ref={ref}
      className="m-wheel"
      role="listbox"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(ev) => {
        if (ev.key === "ArrowDown") {
          ev.preventDefault();
          ir(index + 1);
        } else if (ev.key === "ArrowUp") {
          ev.preventDefault();
          ir(index - 1);
        }
      }}
    >
      {options.map((o, i) => (
        <div
          key={String(o.value)}
          role="option"
          aria-selected={i === index}
          className="m-wheel-item m-num"
          onClick={() => ir(i)}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}

/** Opciones numericas de `min` a `max`. */
export function range(
  min: number,
  max: number,
  step = 1,
  format: (v: number) => string = String,
): WheelOption<number>[] {
  const out: WheelOption<number>[] = [];
  for (let i = 0; min + i * step <= max + 1e-9; i++) {
    const v = Math.round((min + i * step) * 100) / 100;
    out.push({ value: v, label: format(v) });
  }
  return out;
}

/** Las columnas de un sheet, bajo una sola banda de seleccion. */
export function Wheels({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-wheels">
      <div className="m-wheels-band" aria-hidden="true" />
      {children}
    </div>
  );
}

/** Una o mas columnas con su etiqueta encima (p. ej. «Peso»). */
export function WheelGroup({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="m-wheel-group">
      <span className="m-field-label">{label}</span>
      <div className="m-wheel-cols">
        {children}
        {unit && <span className="m-wheel-unit">{unit}</span>}
      </div>
    </div>
  );
}
