/** Descarga y optimiza las imágenes públicas identificadas en el manifiesto.
 * node scripts/importar-imagenes-restaurantes.mjs
 * La fuente de una foto no verifica la nutrición del producto.
 */
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const sources = JSON.parse(
  await readFile(
    new URL("./datos/imagenes-restaurantes-fuentes.json", import.meta.url),
  ),
);
const directory = new URL("../public/images/restaurants/", import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = { restaurants: [], items: [] };
const failures = [];
for (const kind of ["restaurants", "items"]) {
  const records = sources[kind];
  for (let offset = 0; offset < records.length; offset += 6) {
    await Promise.all(
      records.slice(offset, offset + 6).map(async (record) => {
        try {
          const filename =
            createHash("sha256")
              .update(record.imageUrl + (record.background ?? ""))
              .digest("hex")
              .slice(0, 20) + ".webp";
          const destination = new URL(filename, directory);
          try {
            await access(destination);
          } catch {
            const response = await fetch(record.imageUrl, {
              signal: AbortSignal.timeout(20000),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = Buffer.from(await response.arrayBuffer());
            const pipeline = sharp(data).rotate();
            if (record.background)
              pipeline.flatten({ background: record.background });
            await pipeline
              .resize({
                width: kind === "items" ? 480 : 192,
                height: kind === "items" ? 480 : 192,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 82 })
              .toFile(destination.pathname);
          }
          manifest[kind].push({
            name: record.name,
            ...(record.restaurant ? { restaurant: record.restaurant } : {}),
            src: "/images/restaurants/" + filename,
            sourceUrl: record.sourceUrl,
          });
        } catch (error) {
          failures.push({ name: record.name, error: error.message });
        }
      }),
    );
  }
  manifest[kind].sort(
    (a, b) =>
      (a.restaurant ?? "").localeCompare(b.restaurant ?? "") ||
      a.name.localeCompare(b.name),
  );
}
await writeFile(
  new URL("../src/features/restaurants/data/images.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    restaurants: manifest.restaurants.length,
    items: manifest.items.length,
    failures,
  }),
);
if (failures.length) process.exitCode = 1;
