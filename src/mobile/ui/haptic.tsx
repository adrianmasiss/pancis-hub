"use client";

/**
 * La vibracion en iPhone. Safari no deja vibrar por codigo: solo da su toque
 * cuando el dedo cambia un interruptor nativo (`<input type="checkbox"
 * switch>`). Este interruptor invisible tapa a su padre: el dedo cae en el,
 * vibra, y el toque se reenvia al padre (boton o enlace) como un clic.
 *
 * Va como primer hijo de lo que debe vibrar. En Android no estorba: ahi
 * vibra `triggerHaptic`, que sigue en cada `onClick`.
 */
export function Haptic() {
  return (
    <input
      ref={(el) => el?.setAttribute("switch", "")}
      type="checkbox"
      className="m-haptic"
      tabIndex={-1}
      aria-hidden="true"
      onClick={(e) => {
        /* Sin `preventDefault`: cancelaria el cambio del interruptor y con el
           la vibracion. El padre recibe su propio clic. */
        e.stopPropagation();
        e.currentTarget.parentElement?.click();
      }}
    />
  );
}
