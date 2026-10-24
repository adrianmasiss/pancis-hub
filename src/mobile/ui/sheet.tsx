"use client";

import { Dialog } from "radix-ui";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import { MOBILE_PORTAL_ID } from "@/mobile/routes";

/**
 * Bottom sheet de la vista movil: sube desde abajo, vidrio, scrim difuminado.
 *
 * Se arrastra desde el asa para cerrar; al soltar decide por la velocidad o
 * por cuanto bajo, y el resorte hereda la velocidad del dedo (apple-design
 * §5). Con «reducir movimiento» solo hay un fundido.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Texto bajo el titulo; si falta, el titulo basta como nombre accesible. */
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const drag = useDragControls();
  // Solo se monta abierto, y abrir es siempre del cliente: hay `document`.
  const container =
    open && typeof document !== "undefined"
      ? document.getElementById(MOBILE_PORTAL_ID)
      : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount container={container}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="m-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0.15 : 0.3 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="m-sheet"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={
                  reduce
                    ? { duration: 0.15 }
                    : { type: "spring", bounce: 0, duration: 0.5 }
                }
                drag={reduce ? false : "y"}
                dragListener={false}
                dragControls={drag}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.9 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 600) {
                    onOpenChange(false);
                  }
                }}
              >
                <div
                  className="m-sheet-grabber"
                  aria-hidden="true"
                  onPointerDown={(e) => drag.start(e)}
                />
                <Dialog.Title className="m-sheet-title">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="m-sheet-text">
                    {description}
                  </Dialog.Description>
                ) : (
                  <Dialog.Description className="sr-only">
                    {title}
                  </Dialog.Description>
                )}
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
