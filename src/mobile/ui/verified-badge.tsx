/**
 * Check de verificado, como el de las redes: un sello lleno del acento con la
 * palomita encima. Sólo para alimentos cuyos números son reales y correctos
 * (`isConfirmedFood`); el sello es el de `BadgeCheck` de lucide, relleno.
 */
export function VerifiedBadge({
  size = 16,
  decorative = false,
}: {
  size?: number;
  /** Junto a un texto que ya dice «Verificado»: no repetirlo al lector. */
  decorative?: boolean;
}) {
  return (
    <svg
      className="m-verified"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": "Verificado" })}
    >
      {!decorative && <title>Verificado</title>}
      <path
        className="m-verified-seal"
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      />
      <path className="m-verified-check" d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    </svg>
  );
}
