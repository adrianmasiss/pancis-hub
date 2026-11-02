"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Droplet, Undo2 } from "lucide-react";
import { useWater } from "@/features/nutrition/components/use-water";
import { triggerHaptic } from "@/lib/haptics";
import { Haptic } from "@/mobile/ui/haptic";
import { litros } from "./format";

/**
 * El agua del dia: cantidad y botones en una fila, y debajo una linea que se
 * llena en azul con una ola en el borde. Cada toque la sube con una animacion
 * corta; al llegar a la meta cambia a verde con un check y una vibracion de
 * logro.
 */
export function WaterCard({
  date,
  ml,
  targetMl,
}: {
  date: string;
  ml: number;
  targetMl: number | null;
}) {
  const water = useWater({ date, ml, targetMl });
  const meta = targetMl && targetMl > 0 ? targetMl : null;
  const ratio = meta ? Math.min(1, water.shown / meta) : 0;
  const cumplida = meta !== null && water.shown >= meta;

  /* La celebracion solo cuando se cruza la meta en esta visita, no al abrir
     un dia que ya estaba cumplido. */
  const antes = useRef(cumplida);
  const [festejo, setFestejo] = useState(false);
  useEffect(() => {
    if (cumplida && !antes.current) {
      triggerHaptic("success");
      setFestejo(true);
      const t = window.setTimeout(() => setFestejo(false), 1400);
      antes.current = cumplida;
      return () => window.clearTimeout(t);
    }
    antes.current = cumplida;
  }, [cumplida]);

  return (
    <div
      className="m-water"
      data-done={cumplida ? "" : undefined}
      data-festejo={festejo ? "" : undefined}
    >
      <div className="m-water-row">
        <span className="m-water-icon" aria-hidden="true">
          {cumplida ? (
            <Check size={17} strokeWidth={3} />
          ) : (
            <Droplet size={17} fill="currentColor" />
          )}
        </span>
        <div className="m-water-text">
          <span className="m-water-label">
            {cumplida ? "Meta cumplida" : "Agua"}
          </span>
          <span className="m-water-amount m-num">
            {litros(water.shown)}
            <small>{meta ? ` / ${litros(meta)} L` : " L"}</small>
          </span>
        </div>
        {water.shown > 0 && (
          <button
            type="button"
            className="m-water-undo m-press"
            aria-label="Quitar el último registro de agua"
            disabled={water.pending}
            onClick={water.undo}
          >
            <Haptic />
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
        {[250, 500].map((n) => (
          <button
            key={n}
            type="button"
            className="m-water-add m-press"
            data-variant={n === 250 ? "fill" : "line"}
            aria-label={`Agregar ${n} ml de agua`}
            disabled={water.pending}
            onClick={() => {
              triggerHaptic("light");
              water.add(n);
            }}
          >
            <Haptic />+{n}
          </button>
        ))}
      </div>

      <div
        className="m-water-tank"
        role="progressbar"
        aria-label="Agua del día"
        aria-valuemin={0}
        aria-valuemax={meta ?? undefined}
        aria-valuenow={water.shown}
        aria-valuetext={`${litros(water.shown)} litros${meta ? ` de ${litros(meta)}` : ""}`}
      >
        <div className="m-water-fill" style={{ width: `${ratio * 100}%` }}>
          <svg
            className="m-water-wave"
            viewBox="0 0 40 48"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 0 H20 C28 6 12 12 20 18 C28 24 12 30 20 36 C28 42 12 46 20 48 H0 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
