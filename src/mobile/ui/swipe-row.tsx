"use client";

import { useEffect, useRef, useState } from "react";
import {
  Reorder,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type DragControls,
} from "motion/react";
import { Trash2 } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

export type SwipeAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

/** Lo que se abre la fila por cada accion que deja ver. */
const ACTION = 84;
const LONG_PRESS_MS = 450;

/**
 * Fila que se desliza a la izquierda y deja ver un basurero rojo, como en
 * iOS. Tambien se abre manteniendola presionada o al llegar con el teclado
 * al basurero. Tocar fuera la cierra.
 *
 * Al soltar decide por la velocidad o por cuanto se abrio, y el resorte
 * hereda la velocidad del dedo (apple-design §5).
 *
 * Con `secondary` deja ver otra accion, o varias, a la izquierda del
 * basurero (p. ej. «Reemplazar»).
 *
 * Con `reorder` la fila es ademas un `Reorder.Item`: se arrastra en vertical
 * desde el elemento marcado con `data-drag-handle`, que no abre el basurero.
 */
export function SwipeRow({
  children,
  onDelete,
  deleteLabel,
  className,
  disabled,
  reorder,
  secondary,
  rootClassName,
  ...rest
}: {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel: string;
  className?: string;
  disabled?: boolean;
  reorder?: { value: unknown; controls: DragControls };
  secondary?: SwipeAction | SwipeAction[];
  /** Clase extra del `li` (p. ej. filas sin esquinas de tarjeta). */
  rootClassName?: string;
} & Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>) {
  const reduce = useReducedMotion();
  const extras = secondary ? [secondary].flat() : [];
  const REVEAL = ACTION * (1 + extras.length);
  const x = useMotionValue(0);
  const swipe = useDragControls();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLLIElement>(null);
  // Tras arrastrar o mantener, el «click» que sigue no debe tocar la fila.
  const swallowClick = useRef(false);
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);

  const settle = (to: boolean, velocity = 0) => {
    setOpen(to);
    animate(x, to ? -REVEAL : 0, {
      type: "spring",
      bounce: 0,
      duration: reduce ? 0.2 : 0.35,
      velocity,
    });
  };

  useEffect(() => {
    if (!open) return;
    const close = (ev: PointerEvent) => {
      if (!root.current?.contains(ev.target as Node)) settle(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
    // `settle` es estable en lo que importa (x, reduce).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };

  const inner = (
    <>
      <button
        type="button"
        className="m-swipe-action"
        aria-label={deleteLabel}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onFocus={() => !open && settle(true)}
        onClick={() => {
          triggerHaptic("warning");
          settle(false);
          onDelete();
        }}
      >
        <Trash2 size={extras.length ? 18 : 20} aria-hidden="true" />
        {extras.length > 0 && <span>Eliminar</span>}
      </button>
      {extras.map((action, i) => (
        <button
          key={action.label}
          type="button"
          className="m-swipe-alt"
          style={{ width: ACTION + 24, right: ACTION * (i + 1) }}
          disabled={disabled}
          onFocus={() => !open && settle(true)}
          onClick={() => {
            triggerHaptic("selection");
            settle(false);
            action.onClick();
          }}
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
      <motion.div
        {...rest}
        className={className}
        style={{ x }}
        drag={disabled ? false : "x"}
        dragListener={false}
        dragControls={swipe}
        dragDirectionLock
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={{ left: 0.25, right: 0 }}
        dragMomentum={false}
        onDragStart={() => {
          cancelPress();
          swallowClick.current = true;
        }}
        onDragEnd={(_, info) => {
          const abrir =
            info.velocity.x < -300 ||
            (info.velocity.x < 300 && x.get() < -REVEAL / 2);
          settle(abrir, info.velocity.x);
          window.setTimeout(() => (swallowClick.current = false), 0);
        }}
        onPointerDown={(ev) => {
          if (disabled) return;
          // Desde el asa se reordena: ni basurero ni mantener.
          if ((ev.target as Element).closest("[data-drag-handle]")) {
            reorder?.controls.start(ev);
            return;
          }
          swipe.start(ev);
          const start = { x: ev.clientX, y: ev.clientY };
          press.current = {
            ...start,
            timer: window.setTimeout(() => {
              press.current = null;
              swallowClick.current = true;
              triggerHaptic("selection");
              settle(true);
            }, LONG_PRESS_MS),
          };
        }}
        onPointerMove={(ev) => {
          const p = press.current;
          if (p && Math.hypot(ev.clientX - p.x, ev.clientY - p.y) > 8)
            cancelPress();
        }}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onClickCapture={(ev) => {
          if (swallowClick.current) {
            ev.preventDefault();
            ev.stopPropagation();
            swallowClick.current = false;
          } else if (open) {
            // Abierta, un toque en la fila solo la cierra.
            ev.preventDefault();
            ev.stopPropagation();
            settle(false);
          }
        }}
        onContextMenu={(ev) => ev.preventDefault()}
      >
        {children}
      </motion.div>
    </>
  );

  return reorder ? (
    <Reorder.Item
      as="li"
      ref={root}
      value={reorder.value}
      dragListener={false}
      dragControls={reorder.controls}
      className={rootClassName ? `m-swipe ${rootClassName}` : "m-swipe"}
      data-open={open ? "" : undefined}
      onDragStart={() => triggerHaptic("selection")}
    >
      {inner}
    </Reorder.Item>
  ) : (
    <li
      ref={root}
      className={rootClassName ? `m-swipe ${rootClassName}` : "m-swipe"}
      data-open={open ? "" : undefined}
    >
      {inner}
    </li>
  );
}
