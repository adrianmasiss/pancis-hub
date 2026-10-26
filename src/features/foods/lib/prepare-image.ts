/**
 * Re-encodes an image so its longest side is at most `max` px. Photos from a
 * phone camera weigh several MB; what the app shows needs far less.
 */
export async function shrinkImage(
  file: File,
  max: number,
  type = "image/jpeg",
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
  if (!blob) throw new Error("encode");
  return blob;
}

/**
 * Shrinks the photo before it travels: a label is legible at 1600px and the
 * upload drops from several MB to a few hundred KB. Returns plain base64.
 */
export async function prepareImage(file: File): Promise<string> {
  const blob = await shrinkImage(file, 1600);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
