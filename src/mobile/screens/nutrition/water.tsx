"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Droplet, Undo2 } from "lucide-react";
import { useWater } from "@/features/nutrition/components/use-water";
import { triggerHaptic } from "@/lib/haptics";
import { litros } from "./format";

/**
 * El agua del dia: un tanque que se llena en azul con una ola en el borde.
 * Cada toque lo sube con una animacion corta; al llegar a la meta cambia a
 * verde con un check y una vibracion de logro.
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
      <div className="m-row" style={{ alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <div className="m-stat-label m-water-label">
            {cumplida ? (
              <Check size={13} strokeWidth={3} aria-hidden="true" />
            ) : (
              <Droplet size={13} aria-hidden="true" />
            )}
            {cumplida ? "Meta de agua cumplida" : "Agua"}
          </div>
          <div className="m-stat-value">
            {litros(water.shown)}
            <small>{meta ? `/ ${litros(meta)} L` : "L"}</small>
          </div>
        </div>
        {water.shown > 0 && (
          <button
            type="button"
            className="m-icon-btn m-press"
            data-variant="soft"
            aria-label="Quitar el último registro de agua"
            disabled={water.pending}
            onClick={water.undo}
          >
            <Undo2 size={16} aria-hidden="true" />
          </button>
        )}
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

      <div className="m-grid-2">
        {[250, 500].map((n) => (
          <button
            key={n}
            type="button"
            className="m-btn m-press m-water-btn"
            disabled={water.pending}
            onClick={() => {
              triggerHaptic("light");
              water.add(n);
            }}
          >
            + {n} ml
          </button>
        ))}
      </div>
    </div>
  );
}
