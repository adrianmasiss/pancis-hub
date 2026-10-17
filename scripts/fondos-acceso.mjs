/**
 * Prepara los fondos candidatos de la pantalla de acceso.
 *
 *   npm run fondos
 *
 * Entra:  desing-reference/fondos/   (la foto de fondo del login)
 *         desing-reference/carga/    (el fondo de la pantalla de carga)
 * Sale:   public/acceso/fondos/*.webp, public/acceso/carga/*.webp
 *         src/features/auth/fondos-acceso.ts  (la lista que lee el selector)
 *
 * Por que un guion y no arrastrar los archivos a `public/`:
 *
 *  1. REMUESTREO. Los originales vienen a ~950px de ancho y la ventana de
 *     una Retina pide 3300px. Estirar eso en el navegador es magnificado
 *     bilineal, y se ve como papilla. Aqui se remuestrea UNA vez con
 *     lanczos3, que es un filtro mucho mejor. No inventa detalle —eso no se
 *     puede— pero deja de destruirlo.
 *
 *  2. DESENFOQUE HORNEADO, no en CSS. El usuario pidio "un ligero blur sin
 *     perder calidad". Desenfocar en CSS cuesta GPU en cada pintado, obliga
 *     a un `scale()` que tape los cantos translucidos, y se aplica DESPUES
 *     del magnificado, asi que desenfoca la papilla en vez de evitarla.
 *     Horneado a resolucion alta pasa lo contrario: el desenfoque se aplica
 *     sobre el detalle bueno, y de paso el archivo adelgaza, porque una
 *     imagen desenfocada no tiene frecuencias altas que comprimir.
 *
 *  3. MEDIDA. Imprime nitidez antes y despues (gradiente medio) y el peso,
 *     para que la decision no sea de oido.
 *
 * Para probar otra imagen: dejala en la carpeta de entrada y vuelve a correr
 * el guion. El selector la recoge sola.
 */
import { readdir, mkdir, writeFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const CALIDAD = 88;
/* El login lleva el desenfoque ligero que pidio el usuario. La carga NO: es
   una malla, ya es plana, y desenfocarla solo le quitaria la trama. */
const RECETAS = {
  fondos: { ancho: 1800, sigma: Number(process.env.FONDO_SIGMA ?? 3) },
  carga: { ancho: 2400, sigma: 0, soloAgrandar: true },
};
const ACEPTADAS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

/** Nitidez: gradiente medio sobre una copia gris de 800px. 0 = plano. */
async function nitidez(entrada) {
  const { data, info } = await sharp(entrada)
    .resize({ width: 800 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let suma = 0;
  let n = 0;
  for (let y = 1; y < info.height; y += 1) {
    for (let x = 1; x < info.width; x += 1) {
      const i = y * info.width + x;
      suma +=
        Math.abs(data[i] - data[i - 1]) +
        Math.abs(data[i] - data[i - info.width]);
      n += 2;
    }
  }
  return suma / n;
}

const rotulo = (slug) =>
  slug
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim() || slug;

async function procesar(nombreEntrada, nombreSalida) {
  const { ancho, sigma, soloAgrandar = false } = RECETAS[nombreEntrada];
  const dirEntrada = path.join(RAIZ, "desing-reference", nombreEntrada);
  const dirSalida = path.join(RAIZ, "public", "acceso", nombreSalida);

  let archivos = [];
  try {
    archivos = (await readdir(dirEntrada))
      .filter((f) => ACEPTADAS.has(path.extname(f).toLowerCase()))
      .sort();
  } catch {
    console.log(`· ${nombreEntrada}/ no existe, se salta`);
    return [];
  }
  if (archivos.length === 0) {
    console.log(`· ${nombreEntrada}/ esta vacia, se salta`);
    return [];
  }

  // Se vacia la carpeta de salida: asi quitar un candidato de la entrada lo
  // quita de `public/` tambien, y no se acumulan fondos huerfanos en el repo.
  await rm(dirSalida, { recursive: true, force: true });
  await mkdir(dirSalida, { recursive: true });

  const lista = [];
  for (const archivo of archivos) {
    const origen = path.join(dirEntrada, archivo);
    const slug = path
      .basename(archivo, path.extname(archivo))
      .replace(/-blur$/, "");
    const destino = path.join(dirSalida, `${slug}.webp`);

    const antesNitidez = await nitidez(origen);
    const antesMeta = await sharp(origen).metadata();

    let tuberia = sharp(origen).resize({
      width: ancho,
      kernel: "lanczos3",
      withoutEnlargement: soloAgrandar,
    });
    if (sigma > 0) tuberia = tuberia.blur(sigma);
    const { width, height } = await tuberia
      .webp({ quality: CALIDAD, effort: 6, smartSubsample: true })
      .toFile(destino);

    const despuesNitidez = await nitidez(destino);
    const { size } = await stat(destino);

    lista.push({
      slug,
      rotulo: rotulo(slug),
      src: `/acceso/${nombreSalida}/${slug}.webp`,
      width,
      height,
    });
    console.log(
      `  ${slug.padEnd(12)} ${antesMeta.width}x${antesMeta.height} -> ${width}x${height}` +
        `  nitidez ${antesNitidez.toFixed(2)} -> ${despuesNitidez.toFixed(2)}` +
        `  ${(size / 1024).toFixed(0)} KB`,
    );
  }
  return lista;
}

const cabecera = `// GENERADO por scripts/fondos-acceso.mjs — no editar a mano.
// Deja imagenes en desing-reference/{fondos,carga}/ y corre \`npm run fondos\`.
// Login: desenfoque sigma ${RECETAS.fondos.sigma} sobre ${RECETAS.fondos.ancho}px de ancho, WebP q${CALIDAD}.
// Carga: sin desenfoque, ${RECETAS.carga.ancho}px de ancho.

export type FondoCandidato = {
  slug: string;
  rotulo: string;
  /** Valor CSS para \`background-image\`: una \`url()\` o un gradiente. */
  valor: string;
  width?: number;
  height?: number;
};
`;

const serializar = (nombre, lista, extra = []) =>
  `\nexport const ${nombre}: FondoCandidato[] = [\n` +
  [
    ...extra,
    ...lista.map(
      (f) =>
        `  {\n    slug: "${f.slug}",\n    rotulo: "${f.rotulo}",\n    valor: 'url("${f.src}")',\n    width: ${f.width},\n    height: ${f.height},\n  },`,
    ),
  ].join("\n") +
  "\n];\n";

console.log("Fondos de la pantalla de acceso");
const fondos = await procesar("fondos", "fondos");
const cargas = await procesar("carga", "carga");

// El gradiente negro no necesita archivo: es CSS. Va primero en las DOS
// listas —la carga y el login— para poder compararlo con las fotos y las
// mallas sin descargar nada. Es el mismo valor en los dos sitios a proposito:
// si se elige arriba y abajo, la entrada entera es una sola superficie y no
// hay corte de fondo al pasar de la carga al formulario.
const NEGRO = `  {
    slug: "negro",
    rotulo: "Gradiente negro",
    valor:
      "radial-gradient(120% 90% at 50% 34%, #17171a 0%, #0d0d0f 46%, #050506 100%)",
  },`;

await writeFile(
  path.join(RAIZ, "src", "features", "auth", "fondos-acceso.ts"),
  cabecera +
    serializar("fondosDelLogin", fondos, [NEGRO]) +
    serializar("fondosDeLaCarga", cargas, [NEGRO]),
  "utf8",
);
console.log(
  `\nEscrito src/features/auth/fondos-acceso.ts — ${fondos.length + 1} fondos de login, ${cargas.length + 1} de carga.`,
);
