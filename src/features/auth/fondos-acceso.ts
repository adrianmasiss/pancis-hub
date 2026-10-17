// GENERADO por scripts/fondos-acceso.mjs — no editar a mano.
// Deja imagenes en desing-reference/{fondos,carga}/ y corre `npm run fondos`.
// Login: desenfoque sigma 3 sobre 1800px de ancho, WebP q88.
// Carga: sin desenfoque, 2400px de ancho.

export type FondoCandidato = {
  slug: string;
  rotulo: string;
  /** Valor CSS para `background-image`: una `url()` o un gradiente. */
  valor: string;
  width?: number;
  height?: number;
};

export const fondosDelLogin: FondoCandidato[] = [
  {
    slug: "negro",
    rotulo: "Gradiente negro",
    valor:
      "radial-gradient(120% 90% at 50% 34%, #17171a 0%, #0d0d0f 46%, #050506 100%)",
  },
  {
    slug: "00-actual",
    rotulo: "Actual",
    valor: 'url("/acceso/fondos/00-actual.webp")',
    width: 1800,
    height: 3177,
  },
  {
    slug: "imagen-1",
    rotulo: "Imagen 1",
    valor: 'url("/acceso/fondos/imagen-1.webp")',
    width: 1800,
    height: 2700,
  },
  {
    slug: "imagen-2",
    rotulo: "Imagen 2",
    valor: 'url("/acceso/fondos/imagen-2.webp")',
    width: 1800,
    height: 3129,
  },
  {
    slug: "imagen-3",
    rotulo: "Imagen 3",
    valor: 'url("/acceso/fondos/imagen-3.webp")',
    width: 1800,
    height: 2700,
  },
  {
    slug: "imagen-4",
    rotulo: "Imagen 4",
    valor: 'url("/acceso/fondos/imagen-4.webp")',
    width: 1800,
    height: 3198,
  },
  {
    slug: "imagen-5",
    rotulo: "Imagen 5",
    valor: 'url("/acceso/fondos/imagen-5.webp")',
    width: 1800,
    height: 3198,
  },
  {
    slug: "imagen-6",
    rotulo: "Imagen 6",
    valor: 'url("/acceso/fondos/imagen-6.webp")',
    width: 1800,
    height: 3198,
  },
];

export const fondosDeLaCarga: FondoCandidato[] = [
  {
    slug: "negro",
    rotulo: "Gradiente negro",
    valor:
      "radial-gradient(120% 90% at 50% 34%, #17171a 0%, #0d0d0f 46%, #050506 100%)",
  },
  {
    slug: "malla",
    rotulo: "Malla",
    valor: 'url("/acceso/carga/malla.webp")',
    width: 2400,
    height: 1350,
  },
];
